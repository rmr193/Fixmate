import { Router, Request, Response, NextFunction } from 'express';
import { ObjectId, Filter } from 'mongodb';
import { z } from 'zod';
import { getCollections } from '../config/db';
import {
  verifyToken,
  verifyCustomer,
  verifyTechnician,
} from '../middlewares/auth';
import { BookingDocument, BookingStatus } from '../types/models';
import { AppError, sendSuccess } from '../utils/apiResponse';

const router = Router();

const createBookingSchema = z.object({
  serviceId: z.string().trim().min(1, 'Service ID is required.'),
  customerPhone: z
    .string()
    .trim()
    .min(6, 'Please enter a valid contact phone number.')
    .max(30, 'Phone number cannot exceed 30 characters.'),
  address: z
    .string()
    .trim()
    .min(5, 'Please provide a complete service or pickup address.')
    .max(300, 'Address cannot exceed 300 characters.'),
  preferredDate: z
    .string()
    .or(z.date())
    .refine((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return date.getTime() >= todayStart.getTime();
    }, 'Preferred date cannot be in the past.'),
  problemDescription: z
    .string()
    .trim()
    .min(20, 'Problem description must contain at least 20 characters.')
    .max(2000, 'Problem description cannot exceed 2000 characters.'),
});

const updateStatusSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'in-progress', 'completed'], {
    errorMap: () => ({
      message:
        'Status must be one of: accepted, rejected, in-progress, completed.',
    }),
  }),
  finalAmount: z.coerce.number().optional(),
});

const reviewBookingSchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Rating must be between 1 and 5.')
    .max(5, 'Rating must be between 1 and 5.'),
  review: z
    .string()
    .trim()
    .min(5, 'Please write at least 5 characters for your review.')
    .max(600, 'Review cannot exceed 600 characters.'),
});

/**
 * POST /api/bookings
 * Protected (Customer only): Create a repair request.
 * Enforces duplicate active request prevention and copies service/technician metadata.
 */
router.post(
  '/',
  verifyToken,
  verifyCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createBookingSchema.parse(req.body);
      if (!ObjectId.isValid(parsed.serviceId)) {
        throw new AppError('Invalid service ID.', 400);
      }

      const { services, bookings } = getCollections();
      const service = await services.findOne({
        _id: new ObjectId(parsed.serviceId),
      });

      if (
        !service ||
        service.approvalStatus !== 'approved' ||
        !service.isAvailable
      ) {
        throw new AppError(
          'This service is not available for booking.',
          404
        );
      }

      const customerEmail = req.user!.email.toLowerCase();
      if (service.technicianEmail.toLowerCase() === customerEmail) {
        throw new AppError('You cannot book your own repair service.', 403);
      }

      // Business Rule: Prevent duplicate active bookings for the same service
      const existingActive = await bookings.findOne({
        customerEmail,
        serviceId: service._id.toString(),
        status: { $in: ['requested', 'accepted', 'in-progress'] },
      });

      if (existingActive) {
        throw new AppError(
          'You already have an active request for this service',
          409
        );
      }

      const now = new Date();
      const newBooking: BookingDocument = {
        serviceId: service._id.toString(),
        serviceTitle: service.title,
        serviceImage: service.image,
        category: service.category,
        basePrice: Number(service.basePrice),
        technicianName: service.technicianName,
        technicianEmail: service.technicianEmail.toLowerCase(),
        customerName: req.user!.name,
        customerEmail,
        customerPhone: parsed.customerPhone,
        address: parsed.address,
        preferredDate: new Date(parsed.preferredDate),
        problemDescription: parsed.problemDescription,
        status: 'requested',
        finalAmount: Number(service.basePrice),
        paymentStatus: 'unpaid',
        statusHistory: [
          {
            status: 'requested',
            changedAt: now,
            note: 'Repair request submitted by customer.',
          },
        ],
        createdAt: now,
      };

      const result = await bookings.insertOne(newBooking);

      return sendSuccess(
        res,
        {
          ...newBooking,
          _id: result.insertedId,
        },
        'Repair request submitted successfully.',
        201
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/bookings/my
 * Protected (Customer): Returns all bookings belonging to the logged-in customer + dashboard stats.
 */
router.get(
  '/my',
  verifyToken,
  verifyCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookings, payments } = getCollections();
      const customerEmail = req.user!.email.toLowerCase();

      const [myBookings, myPayments] = await Promise.all([
        bookings
          .find({ customerEmail })
          .sort({ createdAt: -1, preferredDate: -1 })
          .toArray(),
        payments.find({ customerEmail }).sort({ paidAt: -1 }).toArray(),
      ]);

      const totalRequests = myBookings.length;
      const activeJobs = myBookings.filter((b) =>
        ['requested', 'accepted', 'in-progress'].includes(b.status)
      ).length;
      const completedJobs = myBookings.filter(
        (b) => b.status === 'completed'
      ).length;
      const unpaidCompletedJobs = myBookings.filter(
        (b) => b.status === 'completed' && b.paymentStatus === 'unpaid'
      ).length;
      const totalSpent = myPayments.reduce((sum, p) => sum + p.amount, 0);

      return sendSuccess(
        res,
        {
          bookings: myBookings,
          stats: {
            totalRequests,
            activeJobs,
            completedJobs,
            unpaidCompletedJobs,
            totalSpent,
          },
        },
        'Customer bookings retrieved successfully.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * PATCH /api/bookings/:id/cancel
 * Protected (Customer — Challenge 3):
 * Only the booking's customer can cancel it, and ONLY while status === 'requested'.
 */
router.patch(
  '/:id/cancel',
  verifyToken,
  verifyCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        throw new AppError('Invalid booking ID.', 400);
      }

      const { bookings } = getCollections();
      const booking = await bookings.findOne({ _id: new ObjectId(id) });

      if (!booking) {
        throw new AppError('Booking not found.', 404);
      }

      if (
        booking.customerEmail.toLowerCase() !== req.user!.email.toLowerCase()
      ) {
        throw new AppError(
          'Forbidden: You can only cancel your own repair requests.',
          403
        );
      }

      if (booking.status !== 'requested') {
        throw new AppError(
          `Cannot cancel booking: only 'requested' jobs can be cancelled by the customer (current status: '${booking.status}').`,
          400
        );
      }

      const now = new Date();
      const updated = await bookings.findOneAndUpdate(
        { _id: new ObjectId(id), status: 'requested' },
        {
          $set: { status: 'cancelled' },
          $push: {
            statusHistory: {
              status: 'cancelled',
              changedAt: now,
              note: 'Cancelled by customer.',
            },
          },
        },
        { returnDocument: 'after' }
      );

      return sendSuccess(
        res,
        updated,
        'Repair request cancelled successfully.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/bookings/technician
 * Protected (Technician): Returns all bookings assigned to the logged-in technician.
 */
router.get(
  '/technician',
  verifyToken,
  verifyTechnician,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookings } = getCollections();
      const technicianEmail = req.user!.email.toLowerCase();
      const statusFilter =
        typeof req.query.status === 'string' ? req.query.status.trim() : '';

      const filter: Filter<BookingDocument> = { technicianEmail };
      if (statusFilter && statusFilter.toLowerCase() !== 'all') {
        filter.status = statusFilter as BookingStatus;
      }

      const assignedBookings = await bookings
        .find(filter)
        .sort({ createdAt: -1, preferredDate: -1 })
        .toArray();

      return sendSuccess(
        res,
        assignedBookings,
        'Technician job requests retrieved successfully.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * PATCH /api/bookings/:id/status
 * Protected (Technician — Challenge 3):
 * Strict server-enforced job status transition pipeline:
 * - requested -> accepted | rejected
 * - accepted -> in-progress
 * - in-progress -> completed (requires finalAmount > 0)
 */
router.patch(
  '/:id/status',
  verifyToken,
  verifyTechnician,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        throw new AppError('Invalid booking ID.', 400);
      }

      const parsed = updateStatusSchema.parse(req.body);
      const { bookings } = getCollections();

      const booking = await bookings.findOne({ _id: new ObjectId(id) });
      if (!booking) {
        throw new AppError('Booking not found.', 404);
      }

      if (
        booking.technicianEmail.toLowerCase() !== req.user!.email.toLowerCase()
      ) {
        throw new AppError(
          'Forbidden: Only the assigned technician can update this job status.',
          403
        );
      }

      const currentStatus = booking.status;
      const nextStatus = parsed.status;

      // Strict state machine validation (Challenge 3)
      const validTransitions: Record<BookingStatus, BookingStatus[]> = {
        requested: ['accepted', 'rejected'],
        accepted: ['in-progress'],
        'in-progress': ['completed'],
        completed: [],
        rejected: [],
        cancelled: [],
      };

      const allowedNext = validTransitions[currentStatus] || [];
      if (!allowedNext.includes(nextStatus)) {
        throw new AppError(
          `Invalid status transition from '${currentStatus}' to '${nextStatus}'.`,
          400
        );
      }

      const updateFields: Partial<BookingDocument> = {
        status: nextStatus,
      };

      if (nextStatus === 'completed') {
        if (
          parsed.finalAmount === undefined ||
          isNaN(Number(parsed.finalAmount)) ||
          Number(parsed.finalAmount) <= 0
        ) {
          throw new AppError(
            'A valid final amount greater than 0 is required when marking a job completed.',
            400
          );
        }
        updateFields.finalAmount = Number(
          Number(parsed.finalAmount).toFixed(2)
        );
      }

      const now = new Date();
      const updated = await bookings.findOneAndUpdate(
        { _id: new ObjectId(id), status: currentStatus },
        {
          $set: updateFields,
          $push: {
            statusHistory: {
              status: nextStatus,
              changedAt: now,
              note:
                nextStatus === 'completed'
                  ? `Job marked completed with final amount $${updateFields.finalAmount}.`
                  : `Status updated to ${nextStatus} by technician.`,
            },
          },
        },
        { returnDocument: 'after' }
      );

      return sendSuccess(
        res,
        updated,
        `Job status updated to '${nextStatus}' successfully.`
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * POST /api/bookings/:id/review
 * Protected (Customer — Optional Enhancement 2):
 * Rate and review a paid completed booking.
 */
router.post(
  '/:id/review',
  verifyToken,
  verifyCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        throw new AppError('Invalid booking ID.', 400);
      }

      const parsed = reviewBookingSchema.parse(req.body);
      const { bookings } = getCollections();

      const booking = await bookings.findOne({ _id: new ObjectId(id) });
      if (!booking) {
        throw new AppError('Booking not found.', 404);
      }

      if (
        booking.customerEmail.toLowerCase() !== req.user!.email.toLowerCase()
      ) {
        throw new AppError(
          'Forbidden: You can only review your own bookings.',
          403
        );
      }

      if (booking.status !== 'completed' || booking.paymentStatus !== 'paid') {
        throw new AppError(
          'Reviews can only be submitted after a completed job has been paid.',
          400
        );
      }

      const updated = await bookings.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            rating: parsed.rating,
            review: parsed.review,
            reviewedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      return sendSuccess(
        res,
        updated,
        'Thank you! Your review has been published.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
