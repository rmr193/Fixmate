import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import serviceRoutes from './routes/service.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes, { stripeWebhookHandler } from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

export function createApp(): Application {
  const app = express();
  app.disable('x-powered-by');

  // Security headers middleware
  app.use((_req: Request, res: Response, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
    }
    next();
  });

  // Strict CORS configuration allowing only explicitly trusted origins
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalized = origin.replace(/\/$/, '');
        if (
          env.TRUSTED_ORIGINS.includes(normalized) ||
          normalized === env.CLIENT_URL ||
          normalized === 'https://fixmate-spmy.vercel.app' ||
          (env.NODE_ENV !== 'production' &&
            (normalized.startsWith('http://localhost:') ||
              normalized.startsWith('http://127.0.0.1:')))
        ) {
          return callback(null, true);
        }
        return callback(new Error('Origin not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
    })
  );

  // Challenge 4: Mount Stripe Webhook with raw body parser BEFORE express.json()
  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response, next) => {
      try {
        await connectDB();
        await stripeWebhookHandler(req, res);
      } catch (err) {
        next(err);
      }
    }
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Ensure MongoDB is connected on every request (supports both Vercel Serverless and traditional Node servers)
  app.use(async (_req: Request, _res: Response, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      next(err);
    }
  });

  // Health & Root Endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      name: 'FixMate API Server',
      version: '1.0.0',
      status: 'operational',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'healthy',
      collections: ['users', 'services', 'bookings', 'payments'],
    });
  });

  // Mount API Modules
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 & Centralized Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();

async function startServer() {
  try {
    await connectDB();
    console.log(`[MongoDB] Connected to database: ${env.MONGODB_DB_NAME}`);

    app.listen(env.PORT, () => {
      console.log(
        `[FixMate Server] Running on http://localhost:${env.PORT} (${env.NODE_ENV})`
      );
    });
  } catch (err) {
    console.error('[FixMate Server] Failed to start:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export default app;
