import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { env } from '../config/env';
import { getCollections, getDB } from '../config/db';
import { AuthenticatedUser, UserRole } from '../types/models';
import { sendError } from '../utils/apiResponse';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
  iat?: number;
  exp?: number;
}

export function signJwtToken(user: {
  _id: string | ObjectId;
  email: string;
  role: UserRole;
  name: string;
}): string {
  const payload: JwtPayload = {
    sub: user._id.toString(),
    email: user.email.toLowerCase(),
    role: user.role,
    name: user.name,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token && token !== 'null' && token !== 'undefined') {
      return token;
    }
  }

  const headerToken = req.headers['x-access-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }

  return null;
}

/**
 * Challenge 2: verifyToken middleware
 * Verifies JWT signature, expiration, and resolves authoritative user identity & role from MongoDB.
 */
export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req);
    if (!token) {
      return sendError(
        res,
        'Authentication required. Missing or invalid bearer token.',
        401
      );
    }

    let decoded: JwtPayload | null = null;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
      }) as JwtPayload;
    } catch {
      // Fallback: check if token is a raw BetterAuth session token in MongoDB 'session' collection
      const db = getDB();
      const sessionDoc = await db.collection('session').findOne({
        token,
        expiresAt: { $gt: new Date() },
      });

      if (!sessionDoc) {
        return sendError(res, 'Invalid or expired authentication token.', 401);
      }

      const { users } = getCollections();
      const userIdFilter = ObjectId.isValid(sessionDoc.userId)
        ? {
            $or: [
              { _id: new ObjectId(sessionDoc.userId) },
              { id: String(sessionDoc.userId) },
            ],
          }
        : { id: String(sessionDoc.userId) };
      const sessionUser = await users.findOne(userIdFilter as Record<string, unknown>);
      if (!sessionUser) {
        return sendError(res, 'User account associated with token no longer exists.', 401);
      }

      req.user = {
        _id: (sessionUser._id || sessionUser.id || '').toString(),
        name: sessionUser.name,
        email: sessionUser.email.toLowerCase(),
        role: (sessionUser.role as UserRole) || 'customer',
        image: sessionUser.image || '',
        phone: sessionUser.phone || '',
        area: sessionUser.area || '',
        bio: sessionUser.bio || '',
      };
      return next();
    }

    if (!decoded || !decoded.email) {
      return sendError(res, 'Malformed authentication token payload.', 401);
    }

    const { users } = getCollections();
    const userDoc = await users.findOne({
      email: decoded.email.toLowerCase(),
    });

    if (!userDoc) {
      return sendError(res, 'User account not found or has been deactivated.', 401);
    }

    // Always enforce database role & email — never trust client token role if role was changed by admin
    req.user = {
      _id: (userDoc._id || userDoc.id || decoded.sub).toString(),
      name: userDoc.name,
      email: userDoc.email.toLowerCase(),
      role: (userDoc.role as UserRole) || 'customer',
      image: userDoc.image || '',
      phone: userDoc.phone || '',
      area: userDoc.area || '',
      bio: userDoc.bio || '',
    };

    return next();
  } catch {
    return sendError(res, 'Authentication failed. Unauthorized access.', 401);
  }
}

/**
 * Challenge 2: verifyCustomer middleware
 */
export function verifyCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return sendError(res, 'Authentication required.', 401);
  }
  if (req.user.role !== 'customer') {
    return sendError(
      res,
      'Forbidden: Only customer accounts can perform this action.',
      403
    );
  }
  return next();
}

/**
 * Challenge 2: verifyTechnician middleware
 */
export function verifyTechnician(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return sendError(res, 'Authentication required.', 401);
  }
  if (req.user.role !== 'technician') {
    return sendError(
      res,
      'Forbidden: Only verified technician accounts can perform this action.',
      403
    );
  }
  return next();
}

/**
 * Challenge 2: verifyAdmin middleware
 */
export function verifyAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return sendError(res, 'Authentication required.', 401);
  }
  if (req.user.role !== 'admin') {
    return sendError(
      res,
      'Forbidden: Administrator privileges are required to access this resource.',
      403
    );
  }
  return next();
}
