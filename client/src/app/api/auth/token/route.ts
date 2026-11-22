import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { auth, mongoDb } from '@/lib/auth';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'fixmate_jwt_hs256_signing_secret_key_2026_verified';

/**
 * GET /api/auth/token
 * Inspects the active BetterAuth session cookie, loads the authoritative user record from MongoDB 'users',
 * and issues a signed HS256 JWT for authenticating requests to the Express API server.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'No active BetterAuth session.' },
        { status: 401 }
      );
    }

    const escapedEmail = session.user.email.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );
    const userDoc = await mongoDb.collection('users').findOne({
      email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') },
    });

    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'User record not found.' },
        { status: 404 }
      );
    }

    const userId = (userDoc._id || userDoc.id || session.user.id).toString();
    let role = (userDoc.role as string) || 'customer';

    // Support applying 'technician' or 'customer' role chosen on /sign-up prior to Google OAuth redirect
    const requestedOAuthRole = req.nextUrl.searchParams.get('oauth_role');
    if (
      role !== 'admin' &&
      (requestedOAuthRole === 'technician' || requestedOAuthRole === 'customer') &&
      requestedOAuthRole !== role
    ) {
      await mongoDb.collection('users').updateOne(
        { _id: userDoc._id },
        { $set: { role: requestedOAuthRole, updatedAt: new Date() } }
      );
      role = requestedOAuthRole;
    }

    const token = jwt.sign(
      {
        sub: userId,
        email: userDoc.email.toLowerCase(),
        role,
        name: userDoc.name,
      },
      JWT_SECRET,
      {
        expiresIn: '7d',
        algorithm: 'HS256',
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          _id: userId,
          name: userDoc.name,
          email: userDoc.email,
          image: userDoc.image || '',
          role,
          phone: userDoc.phone || '',
          area: userDoc.area || '',
          bio: userDoc.bio || '',
          createdAt: userDoc.createdAt,
        },
      },
    });
  } catch (err) {
    console.error('[BetterAuth Token Route Error]:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to issue JWT from session.' },
      { status: 500 }
    );
  }
}
