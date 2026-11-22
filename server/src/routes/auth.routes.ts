import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getCollections, getDB } from '../config/db';
import { signJwtToken, verifyToken } from '../middlewares/auth';
import { createRateLimiter } from '../middlewares/rateLimit';
import { AppError, sendSuccess } from '../utils/apiResponse';
import { isSafeImageUrl } from '../utils/validators';
import { UserRole } from '../types/models';

const router = Router();

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  message: 'Too many authentication attempts. Please wait 15 minutes and try again.',
});

const SCRYPT_CONFIG = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};

function generateScryptKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password.normalize('NFKC'),
      salt,
      SCRYPT_CONFIG.dkLen,
      {
        N: SCRYPT_CONFIG.N,
        r: SCRYPT_CONFIG.r,
        p: SCRYPT_CONFIG.p,
        maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2,
      },
      (err, key) => {
        if (err) reject(err);
        else resolve(key);
      }
    );
  });
}

export async function hashBetterAuthPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await generateScryptKey(password, salt);
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyBetterAuthPassword(
  hash: string,
  password: string
): Promise<boolean> {
  const [salt, keyHex] = hash.split(':');
  if (!salt || !keyHex) return false;
  const derivedKey = await generateScryptKey(password, salt);
  const derivedHex = derivedKey.toString('hex');
  if (derivedHex.length !== keyHex.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(derivedHex, 'utf8'),
    Buffer.from(keyHex, 'utf8')
  );
}

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters long.')
    .max(80, 'Full name cannot exceed 80 characters.'),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address.')
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.')
    .max(128, 'Password cannot exceed 128 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.'),
  role: z.string().optional(),
  phone: z.string().trim().max(30).optional().default(''),
  area: z.string().trim().max(100).optional().default(''),
  bio: z.string().trim().max(500).optional().default(''),
  image: z
    .string()
    .trim()
    .refine((v) => v === '' || isSafeImageUrl(v), 'Invalid image URL.')
    .optional()
    .default(''),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, 'Password is required.').max(128),
});

/**
 * POST /api/auth/register
 * Registers a Customer or Technician. Never allows public admin registration.
 * If any role other than 'customer' or 'technician' is sent, defaults to 'customer'.
 */
router.post(
  '/register',
  authRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const { users } = getCollections();
      const db = getDB();

      const existing = await users.findOne({ email: parsed.email });
      if (existing) {
        throw new AppError('An account with this email already exists.', 409);
      }

      // Enforce strict registration role rule: only 'customer' or 'technician' allowed
      const safeRole: UserRole =
        parsed.role === 'technician' ? 'technician' : 'customer';

      const now = new Date();
      const userId = new ObjectId();
      const passwordHash = await hashBetterAuthPassword(parsed.password);

      const defaultAvatar =
        parsed.image ||
        `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
          parsed.name
        )}&backgroundColor=1e40af`;

      const newUser = {
        _id: userId,
        id: userId.toString(),
        name: parsed.name,
        email: parsed.email,
        emailVerified: true,
        image: defaultAvatar,
        role: safeRole,
        phone: parsed.phone || '',
        area: parsed.area || 'Dhaka, Bangladesh',
        bio: parsed.bio || '',
        createdAt: now,
        updatedAt: now,
      };

      await users.insertOne(newUser);

      // Store credential entry in BetterAuth 'account' collection for full compatibility
      await db.collection('account').updateOne(
        { userId: userId.toString(), providerId: 'credential' },
        {
          $set: {
            accountId: userId.toString(),
            providerId: 'credential',
            userId: userId.toString(),
            password: passwordHash,
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true }
      );

      const token = signJwtToken({
        _id: userId,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      });

      return sendSuccess(
        res,
        {
          token,
          user: {
            _id: userId.toString(),
            name: newUser.name,
            email: newUser.email,
            image: newUser.image,
            role: newUser.role,
            phone: newUser.phone,
            area: newUser.area,
            bio: newUser.bio,
            createdAt: newUser.createdAt,
          },
        },
        'Account registered successfully.',
        201
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticates user credentials and issues a signed JWT.
 */
router.post(
  '/login',
  authRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const { users } = getCollections();
      const db = getDB();

      const user = await users.findOne({ email: parsed.email });
      if (!user) {
        throw new AppError('Invalid email or password.', 401);
      }

      const userIdStr = (user._id || user.id || '').toString();
      const account = await db.collection('account').findOne({
        $or: [
          { userId: userIdStr, providerId: 'credential' },
          { userId: user._id, providerId: 'credential' },
          { accountId: user.email },
        ],
      });

      let passwordValid = false;
      const storedHash =
        (account?.password as string | undefined) ||
        (user as unknown as { password?: string }).password;

      if (storedHash) {
        try {
          passwordValid = await verifyBetterAuthPassword(
            storedHash,
            parsed.password
          );
        } catch {
          passwordValid = false;
        }
      }

      if (!passwordValid) {
        throw new AppError('Invalid email or password.', 401);
      }

      const token = signJwtToken({
        _id: userIdStr,
        email: user.email,
        role: (user.role as UserRole) || 'customer',
        name: user.name,
      });

      return sendSuccess(
        res,
        {
          token,
          user: {
            _id: userIdStr,
            name: user.name,
            email: user.email,
            image: user.image || '',
            role: (user.role as UserRole) || 'customer',
            phone: user.phone || '',
            area: user.area || '',
            bio: user.bio || '',
            createdAt: user.createdAt,
          },
        },
        'Signed in successfully.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/auth/me
 * Verifies current JWT and returns authoritative user profile + refreshed token.
 */
router.get('/me', verifyToken, async (req: Request, res: Response) => {
  const user = req.user!;
  const token = signJwtToken({
    _id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return sendSuccess(
    res,
    {
      token,
      user,
    },
    'Authenticated user profile retrieved.'
  );
});

export default router;
