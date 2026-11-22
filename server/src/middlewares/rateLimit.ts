import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const buckets = new Map<string, RateLimitBucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.ip || req.socket.remoteAddress || 'unknown';

    // Periodic cleanup to avoid unbounded memory growth
    if (buckets.size > 2000) {
      for (const [key, entry] of buckets.entries()) {
        if (entry.resetAt <= now) {
          buckets.delete(key);
        }
      }
    }

    const existing = buckets.get(clientIp);
    if (!existing || existing.resetAt <= now) {
      buckets.set(clientIp, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count > options.maxRequests) {
      return sendError(
        res,
        options.message ||
          'Too many requests. Please wait a few minutes and try again.',
        429
      );
    }

    return next();
  };
}
