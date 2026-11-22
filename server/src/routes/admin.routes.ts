import { Router, Request, Response, NextFunction } from 'express';
import { ObjectId, Filter } from 'mongodb';
import { z } from 'zod';
import { getCollections } from '../config/db';
import { verifyToken, verifyAdmin } from '../middlewares/auth';
import {
  ApprovalStatus,
  BookingDocument,
  BookingStatus,
  ServiceDocument,
  UserDocument,
} from '../types/models';
import { AppError, sendSuccess } from '../utils/apiResponse';

const router = Router();

// All routes in /api/admin require verifyToken and verifyAdmin (Challenge 2)
router.use(verifyToken, verifyAdmin);

const updateRoleSchema = z.object({
  role: z.enum(['customer', 'technician'], {
    message:
      'Only customer or technician roles can be assigned. Only one administrator is permitted on the platform.',
  }),
});

const updateApprovalSchema = z.object({
  approvalStatus: z.enum(['approved', 'rejected', 'pending'], {
    message: 'Approval status must be approved, rejected, or pending.',
  }),
});

/**
 * GET /api/admin/stats
 * Admin Overview KPIs & analytics charts data.
 */
router.get(
  '/stats',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { users, services, bookings, payments } = getCollections();

      const [
        totalUsers,
        totalTechnicians,
        totalCustomers,
        pendingServices,
        approvedServices,
        totalServices,
        totalBookings,
        revenueAgg,
        bookingsByStatusAgg,
        servicesByCategoryAgg,
        recentTransactions,
      ] = await Promise.all([
        users.countDocuments({}),
        users.countDocuments({ role: 'technician' }),
        users.countDocuments({ role: 'customer' }),
        services.countDocuments({ approvalStatus: 'pending' }),
        services.countDocuments({ approvalStatus: 'approved' }),
        services.countDocuments({}),
        bookings.countDocuments({}),
        payments
          .aggregate<{ totalRevenue: number; count: number }>([
            { $match: { paymentStatus: 'paid' } },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$amount' },
                count: { $sum: 1 },
              },
            },
          ])
          .toArray(),
        bookings
          .aggregate<{ _id: string; count: number }>([
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ])
          .toArray(),
        services
          .aggregate<{ _id: string; count: number }>([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ])
          .toArray(),
        payments.find({}).sort({ paidAt: -1 }).limit(5).toArray(),
      ]);

      return sendSuccess(
        res,
        {
          totalUsers,
          totalTechnicians,
          totalCustomers,
          pendingServices,
          approvedServices,
          totalServices,
          totalBookings,
          totalRevenue: revenueAgg[0]?.totalRevenue || 0,
          totalTransactions: revenueAgg[0]?.count || 0,
          bookingsByStatus: bookingsByStatusAgg.map((b) => ({
            status: b._id,
            count: b.count,
          })),
          servicesByCategory: servicesByCategoryAgg.map((c) => ({
            category: c._id,
            count: c.count,
          })),
          recentTransactions,
        },
        'Admin dashboard statistics retrieved.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/admin/users
 * Returns all users with optional search or role filter.
 */
router.get(
  '/users',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { users } = getCollections();
      const roleFilter =
        typeof req.query.role === 'string' ? req.query.role.trim() : '';
      const search =
        typeof req.query.search === 'string' ? req.query.search.trim() : '';

      const allowedRoles = ['customer', 'technician', 'admin'];
      const filter: Filter<UserDocument> = {};
      if (
        roleFilter &&
        roleFilter.toLowerCase() !== 'all' &&
        allowedRoles.includes(roleFilter)
      ) {
        filter.role = roleFilter as UserDocument['role'];
      }
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        filter.$or = [{ name: regex }, { email: regex }];
      }

      const userList = await users
        .find(filter, {
          projection: {
            _id: 1,
            name: 1,
            email: 1,
            image: 1,
            role: 1,
            phone: 1,
            area: 1,
            bio: 1,
            createdAt: 1,
          },
        })
        .sort({ createdAt: -1 })
        .toArray();

      return sendSuccess(res, userList, 'Users retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * PATCH /api/admin/users/:id/role
 * Updates a user's role. An admin cannot change their own role.
 */
router.patch(
  '/users/:id/role',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      if (!ObjectId.isValid(id)) {
        throw new AppError('Invalid user ID.', 400);
      }

      const { role } = updateRoleSchema.parse(req.body);
      const { users } = getCollections();

      const targetUser = await users.findOne({ _id: new ObjectId(id) });
      if (!targetUser) {
        throw new AppError('User not found.', 404);
      }

      // Business Rule: An admin cannot change their own role, and only one admin exists
      if (
        targetUser.email.toLowerCase() === req.user!.email.toLowerCase() ||
        targetUser._id?.toString() === req.user!._id ||
        targetUser.role === 'admin'
      ) {
        throw new AppError(
          'Forbidden: The sole platform administrator role cannot be modified.',
          403
        );
      }

      const updated = await users.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { role, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      return sendSuccess(
        res,
        {
          _id: updated?._id,
          name: updated?.name,
          email: updated?.email,
          role: updated?.role,
          image: updated?.image,
        },
        `User role updated to '${role}' successfully.`
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/admin/services
 * Lists all services across all technicians with approvalStatus filter.
 * Pending services are prioritized first.
 */
router.get(
  '/services',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { services } = getCollections();
      const statusParam =
        typeof req.query.approvalStatus === 'string'
          ? req.query.approvalStatus.trim()
          : typeof req.query.status === 'string'
          ? req.query.status.trim()
          : '';

      const allowedApprovalStatuses = ['pending', 'approved', 'rejected'];
      const filter: Filter<ServiceDocument> = {};
      if (
        statusParam &&
        statusParam.toLowerCase() !== 'all' &&
        allowedApprovalStatuses.includes(statusParam)
      ) {
        filter.approvalStatus = statusParam as ApprovalStatus;
      }

      const allServices = await services
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

      // Prioritize pending services first when showing all
      const sorted = allServices.sort((a, b) => {
        if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') {
          return -1;
        }
        if (a.approvalStatus !== 'pending' && b.approvalStatus === 'pending') {
          return 1;
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      return sendSuccess(
        res,
        sorted,
        'All technician services retrieved for moderation.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * PATCH /api/admin/services/:id/approval
 * Approve or reject any technician service.
 */
router.patch(
  '/services/:id/approval',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      if (!ObjectId.isValid(id)) {
        throw new AppError('Invalid service ID.', 400);
      }

      const { approvalStatus } = updateApprovalSchema.parse(req.body);
      const { services } = getCollections();

      const updated = await services.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { approvalStatus } },
        { returnDocument: 'after' }
      );

      if (!updated) {
        throw new AppError('Service not found.', 404);
      }

      return sendSuccess(
        res,
        updated,
        `Service '${updated.title}' has been marked as ${approvalStatus}.`
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/admin/bookings
 * Read-only view of all repair jobs on the platform with optional status filter.
 */
router.get(
  '/bookings',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookings } = getCollections();
      const statusParam =
        typeof req.query.status === 'string' ? req.query.status.trim() : '';

      const allowedBookingStatuses = [
        'requested',
        'accepted',
        'rejected',
        'in-progress',
        'completed',
        'cancelled',
      ];
      const filter: Filter<BookingDocument> = {};
      if (
        statusParam &&
        statusParam.toLowerCase() !== 'all' &&
        allowedBookingStatuses.includes(statusParam)
      ) {
        filter.status = statusParam as BookingStatus;
      }

      const allBookings = await bookings
        .find(filter)
        .sort({ createdAt: -1, preferredDate: -1 })
        .toArray();

      return sendSuccess(
        res,
        allBookings,
        'All platform bookings retrieved successfully.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/admin/payments (and /api/admin/transactions)
 * Returns all verified payments and total revenue calculated from payment records.
 */
async function listPaymentsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { payments } = getCollections();
    const allPayments = await payments.find({}).sort({ paidAt: -1 }).toArray();
    const totalRevenue = Number(
      allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toFixed(2)
    );

    return sendSuccess(
      res,
      {
        payments: allPayments,
        totalRevenue,
        totalCount: allPayments.length,
      },
      'Platform transactions and total revenue retrieved.'
    );
  } catch (err) {
    return next(err);
  }
}

router.get('/payments', listPaymentsHandler);
router.get('/transactions', listPaymentsHandler);

export default router;
