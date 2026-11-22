import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { auth, mongoDb } from '@/lib/auth';

const OAUTH_ROLE_ASSIGNMENT_WINDOW_MS = 2 * 60 * 1000; // 2 minutes after signup

/**
 * GET /api/auth/token
 * Inspects the active BetterAuth session cookie, loads the authoritative user record from MongoDB 'users',
 * and issues a signed HS256 JWT for authenticating requests to the Express API server.
 */
export async function GET(req: NextRequest) {
  try {
    const jwtSecret = process.env.JWT_SECRET?.trim();
    if (!jwtSecret) {
      return NextResponse.json(
        { success: false, message: 'Server JWT configuration is missing.' },
        { status: 500 }
      );
    }

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
    const userEmail = String(userDoc.email).toLowerCase();
    let role = (userDoc.role as string) || 'customer';

    // Only allow setting 'technician' or 'customer' role during initial OAuth sign-up
    // (account created within the last 2 minutes and with zero bookings/services)
    const requestedOAuthRole = req.nextUrl.searchParams.get('oauth_role');
    if (
      role !== 'admin' &&
      (requestedOAuthRole === 'technician' || requestedOAuthRole === 'customer') &&
      requestedOAuthRole !== role
    ) {
      const createdAtMs = userDoc.createdAt
        ? new Date(userDoc.createdAt).getTime()
        : 0;
      const isNewlyCreated =
        createdAtMs > 0 &&
        Date.now() - createdAtMs <= OAUTH_ROLE_ASSIGNMENT_WINDOW_MS;

      if (isNewlyCreated) {
        const [bookingCount, serviceCount] = await Promise.all([
          mongoDb.collection('bookings').countDocuments({
            $or: [{ customerEmail: userEmail }, { technicianEmail: userEmail }],
          }),
          mongoDb
            .collection('services')
            .countDocuments({ technicianEmail: userEmail }),
        ]);

        if (bookingCount === 0 && serviceCount === 0) {
          await mongoDb.collection('users').updateOne(
            { _id: userDoc._id },
            { $set: { role: requestedOAuthRole, updatedAt: new Date() } }
          );
          role = requestedOAuthRole;
        }
      }
    }

    const token = jwt.sign(
      {
        sub: userId,
        email: userEmail,
        role,
        name: userDoc.name,
      },
      jwtSecret,
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
