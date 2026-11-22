import { Router, Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import Stripe from 'stripe';
import { z } from 'zod';
import { getCollections } from '../config/db';
import { env } from '../config/env';
import { verifyToken, verifyCustomer } from '../middlewares/auth';
import { PaymentDocument } from '../types/models';
import { AppError, sendSuccess } from '../utils/apiResponse';

const router = Router();

function getStripeClient(): Stripe {
  if (
    !env.STRIPE_SECRET_KEY ||
    !env.STRIPE_SECRET_KEY.startsWith('sk_test_') ||
    env.STRIPE_SECRET_KEY.includes('Placeholder') ||
    env.STRIPE_SECRET_KEY.includes('replace_with')
  ) {
    throw new AppError(
      'Stripe Test Mode Secret Key (STRIPE_SECRET_KEY) is not configured on the server.',
      500
    );
  }

  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
  });
}

const checkoutSchema = z.object({
  bookingId: z.string().trim().min(1, 'Booking ID is required.'),
});

/**
 * Atomic, idempotent payment recorder shared by Stripe Webhook and Checkout Session Verification.
 * Guarantees that the same booking or Stripe session is NEVER recorded twice.
 */
export async function recordVerifiedPayment(params: {
  bookingId: string;
  stripeSessionId: string;
  transactionId: string;
}): Promise<{ payment: PaymentDocument; alreadyProcessed: boolean }> {
  const { bookingId, stripeSessionId, transactionId } = params;
  const { bookings, payments } = getCollections();

  if (!ObjectId.isValid(bookingId)) {
    throw new AppError('Invalid booking ID in payment metadata.', 400);
  }

  // Fast idempotency check
  const existingPayment = await payments.findOne({
    $or: [{ bookingId }, { stripeSessionId }],
  });

  if (existingPayment) {
    // Ensure booking is marked paid even if previous call was interrupted
    await bookings.updateOne(
      { _id: new ObjectId(bookingId) },
      { $set: { paymentStatus: 'paid' } }
    );
    return { payment: existingPayment, alreadyProcessed: true };
  }

  const booking = await bookings.findOne({ _id: new ObjectId(bookingId) });
  if (!booking) {
    throw new AppError('Booking associated with payment was not found.', 404);
  }

  if (booking.status !== 'completed') {
    throw new AppError(
      'Payment gate error: Only completed jobs can be marked as paid.',
      400
    );
  }

  const finalAmount = Number(booking.finalAmount);
  if (isNaN(finalAmount) || finalAmount <= 0) {
    throw new AppError('Invalid final amount on booking.', 400);
  }

  const now = new Date();
  const paymentDoc: PaymentDocument = {
    bookingId: booking._id.toString(),
    serviceTitle: booking.serviceTitle,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail.toLowerCase(),
    technicianName: booking.technicianName,
    technicianEmail: booking.technicianEmail.toLowerCase(),
    amount: finalAmount,
    currency: 'usd',
    transactionId,
    stripeSessionId,
    paymentStatus: 'paid',
    paidAt: now,
  };

  try {
    const upsertResult = await payments.updateOne(
      { bookingId: booking._id.toString() },
      { $setOnInsert: paymentDoc },
      { upsert: true }
    );

    if (upsertResult.upsertedCount === 0) {
      const concurrent = await payments.findOne({
        $or: [{ bookingId }, { stripeSessionId }],
      });
      await bookings.updateOne(
        { _id: new ObjectId(bookingId) },
        { $set: { paymentStatus: 'paid' } }
      );
      if (concurrent) {
        return { payment: concurrent, alreadyProcessed: true };
      }
    }
  } catch (err) {
    // Handle race condition on unique index (11000 duplicate key)
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: number }).code === 11000
    ) {
      const concurrent = await payments.findOne({
        $or: [{ bookingId }, { stripeSessionId }],
      });
      if (concurrent) {
        return { payment: concurrent, alreadyProcessed: true };
      }
    }
    throw err;
  }

  await bookings.updateOne(
    { _id: new ObjectId(bookingId) },
    {
      $set: { paymentStatus: 'paid' },
      $push: {
        statusHistory: {
          status: 'paid',
          changedAt: now,
          note: `Paid $${finalAmount.toFixed(2)} via Stripe (${transactionId}).`,
        },
      },
    }
  );

  const savedPayment = await payments.findOne({
    bookingId: booking._id.toString(),
  });

  return {
    payment: savedPayment || paymentDoc,
    alreadyProcessed: false,
  };
}

/**
 * POST /api/payments/create-checkout-session
 * Protected (Customer — Challenge 2 & Challenge 3 Payment Gate):
 * Creates a real Stripe Checkout Session ONLY when:
 * 1. Booking belongs to logged-in customer
 * 2. Booking status === 'completed'
 * 3. Booking paymentStatus === 'unpaid'
 * 4. Amount is loaded strictly from MongoDB finalAmount (> 0)
 */
router.post(
  '/create-checkout-session',
  verifyToken,
  verifyCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stripe = getStripeClient();
      const { bookingId } = checkoutSchema.parse(req.body);
      if (!ObjectId.isValid(bookingId)) {
        throw new AppError('Invalid booking ID.', 400);
      }

      const { bookings, payments } = getCollections();
      const booking = await bookings.findOne({ _id: new ObjectId(bookingId) });

      if (!booking) {
        throw new AppError('Booking not found.', 404);
      }

      // Ownership Verification
      if (
        booking.customerEmail.toLowerCase() !== req.user!.email.toLowerCase()
      ) {
        throw new AppError(
          'Forbidden: You can only pay for your own bookings.',
          403
        );
      }

      // Completion Gate Verification
      if (booking.status !== 'completed') {
        throw new AppError(
          `Payment is only allowed after the technician completes the job (current status: '${booking.status}').`,
          400
        );
      }

      // Duplicate Payment Gate Verification
      if (booking.paymentStatus === 'paid') {
        throw new AppError('This booking has already been paid.', 400);
      }

      const existingPayment = await payments.findOne({
        bookingId: booking._id.toString(),
      });
      if (existingPayment) {
        throw new AppError(
          'A verified payment record already exists for this booking.',
          409
        );
      }

      const finalAmount = Number(booking.finalAmount);
      if (isNaN(finalAmount) || finalAmount <= 0) {
        throw new AppError('Booking final amount must be greater than 0.', 400);
      }

      const unitAmountCents = Math.round(finalAmount * 100);

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: booking.customerEmail,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `FixMate Repair: ${booking.serviceTitle}`,
                description: `Technician: ${booking.technicianName} | Category: ${booking.category}`,
                ...(booking.serviceImage &&
                booking.serviceImage.startsWith('http')
                  ? { images: [booking.serviceImage] }
                  : {}),
              },
              unit_amount: unitAmountCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingId: booking._id.toString(),
          customerEmail: booking.customerEmail,
          technicianEmail: booking.technicianEmail,
          serviceTitle: booking.serviceTitle,
        },
        success_url: `${env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.CLIENT_URL}/payment/cancel?booking_id=${booking._id.toString()}`,
      });

      return sendSuccess(
        res,
        {
          sessionId: session.id,
          url: session.url,
          amount: finalAmount,
        },
        'Stripe Checkout Session created.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/payments/verify?session_id=...
 * Protected (Customer): Verifies real Stripe Checkout Session on /payment/success and records payment idempotently.
 */
router.get(
  '/verify',
  verifyToken,
  verifyCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stripe = getStripeClient();
      const sessionId =
        typeof req.query.session_id === 'string'
          ? req.query.session_id.trim()
          : '';

      if (!sessionId) {
        throw new AppError('Stripe session_id is required.', 400);
      }

      const { bookings } = getCollections();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (!session || session.payment_status !== 'paid') {
        throw new AppError('Payment has not been completed in Stripe.', 400);
      }

      const bookingId = session.metadata?.bookingId;
      if (!bookingId || !ObjectId.isValid(bookingId)) {
        throw new AppError('Booking reference missing in Stripe session.', 400);
      }

      const booking = await bookings.findOne({ _id: new ObjectId(bookingId) });
      if (!booking) {
        throw new AppError('Booking not found.', 404);
      }

      if (
        booking.customerEmail.toLowerCase() !== req.user!.email.toLowerCase()
      ) {
        throw new AppError(
          'Forbidden: You do not own the booking for this payment session.',
          403
        );
      }

      const transactionId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || `pi_${session.id.slice(-16)}`;

      const result = await recordVerifiedPayment({
        bookingId,
        stripeSessionId: session.id,
        transactionId,
      });

      return sendSuccess(
        res,
        result,
        result.alreadyProcessed
          ? 'Payment already verified.'
          : 'Payment verified and recorded successfully.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/payments/my
 * Protected (Customer): Returns payment history for the logged-in customer.
 */
router.get(
  '/my',
  verifyToken,
  verifyCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { payments } = getCollections();
      const customerEmail = req.user!.email.toLowerCase();

      const myPayments = await payments
        .find({ customerEmail })
        .sort({ paidAt: -1 })
        .toArray();

      return sendSuccess(
        res,
        myPayments,
        'Customer payment history retrieved successfully.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/payments/:id/invoice
 * Protected: Returns verified invoice details for a payment owned by the customer, technician, or admin.
 */
router.get(
  '/:id/invoice',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const { payments, bookings } = getCollections();

      const query = ObjectId.isValid(id)
        ? { $or: [{ _id: new ObjectId(id) }, { bookingId: id }] }
        : { $or: [{ bookingId: id }, { transactionId: id }] };

      const payment = await payments.findOne(query);
      if (!payment) {
        throw new AppError('Payment invoice record not found.', 404);
      }

      const userEmail = req.user!.email.toLowerCase();
      const isOwner =
        req.user!.role === 'admin' ||
        payment.customerEmail.toLowerCase() === userEmail ||
        payment.technicianEmail.toLowerCase() === userEmail;

      if (!isOwner) {
        throw new AppError(
          'Forbidden: You do not have permission to view this invoice.',
          403
        );
      }

      const booking = ObjectId.isValid(payment.bookingId)
        ? await bookings.findOne({ _id: new ObjectId(payment.bookingId) })
        : null;

      return sendSuccess(
        res,
        {
          invoiceNumber: `INV-${payment.transactionId
            .slice(-8)
            .toUpperCase()}`,
          payment,
          booking,
          issuedBy: {
            company: 'FixMate Technologies Ltd.',
            address: 'Level 8, Gulshan Avenue, Dhaka-1212, Bangladesh',
            supportEmail: 'billing@fixmate.com',
          },
        },
        'Invoice data retrieved successfully.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * Challenge 4: Stripe Webhook Handler (Exported for raw body mounting before express.json())
 * POST /api/payments/webhook
 */
export async function stripeWebhookHandler(
  req: Request,
  res: Response
) {
  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'Webhook Error: Missing stripe-signature header.' });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(
          typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
        );

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature';
    return res
      .status(400)
      .json({ success: false, message: `Webhook Error: ${msg}` });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid' && session.metadata?.bookingId) {
        const transactionId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id || `pi_${session.id.slice(-16)}`;

        await recordVerifiedPayment({
          bookingId: session.metadata.bookingId,
          stripeSessionId: session.id,
          transactionId,
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Webhook processing failed';
    return res.status(400).json({ success: false, message: msg });
  }
}

export default router;
