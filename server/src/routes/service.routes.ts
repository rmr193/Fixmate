import { Router, Request, Response, NextFunction } from 'express';
import { ObjectId, Filter, Sort } from 'mongodb';
import { z } from 'zod';
import { getCollections } from '../config/db';
import { verifyToken, verifyTechnician } from '../middlewares/auth';
import {
  SERVICE_CATEGORIES,
  SERVICE_MODES,
  ServiceDocument,
} from '../types/models';
import { AppError, sendSuccess } from '../utils/apiResponse';

const router = Router();

const createServiceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Service title must be at least 3 characters.')
    .max(120, 'Service title cannot exceed 120 characters.'),
  category: z.enum(SERVICE_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid service category.' }),
  }),
  description: z
    .string()
    .trim()
    .min(20, 'Service description must be at least 20 characters.')
    .max(2000, 'Service description cannot exceed 2000 characters.'),
  image: z
    .string()
    .trim()
    .min(5, 'Service image URL is required.'),
  basePrice: z.coerce
    .number()
    .positive('Base price must be a positive number greater than 0.'),
  estimatedDuration: z
    .string()
    .trim()
    .min(2, 'Estimated duration is required (e.g. "2-3 hours").')
    .max(60, 'Estimated duration is too long.'),
  serviceMode: z.enum(SERVICE_MODES, {
    errorMap: () => ({
      message: 'Service mode must be either "Home Visit" or "Shop Drop-off".',
    }),
  }),
  serviceArea: z
    .string()
    .trim()
    .min(2, 'Service area is required (e.g. "Dhanmondi, Dhaka").')
    .max(120, 'Service area cannot exceed 120 characters.'),
});

const updateServiceSchema = createServiceSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});

/**
 * GET /api/services/featured
 * Public: Fetch 6 latest services where approvalStatus === 'approved' and isAvailable === true.
 */
router.get(
  '/featured',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { services } = getCollections();
      const featured = await services
        .find({
          approvalStatus: 'approved',
          isAvailable: true,
        })
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      return sendSuccess(
        res,
        featured,
        'Featured repair services fetched successfully.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/services/my
 * Protected (Technician): Fetch all services created by the logged-in technician + stats.
 */
router.get(
  '/my',
  verifyToken,
  verifyTechnician,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { services, bookings, payments } = getCollections();
      const technicianEmail = req.user!.email;

      const [myServices, pendingRequestsCount, activeJobsCount, completedJobsCount, revenueAgg] =
        await Promise.all([
          services
            .find({ technicianEmail })
            .sort({ createdAt: -1 })
            .toArray(),
          bookings.countDocuments({
            technicianEmail,
            status: 'requested',
          }),
          bookings.countDocuments({
            technicianEmail,
            status: { $in: ['accepted', 'in-progress'] },
          }),
          bookings.countDocuments({
            technicianEmail,
            status: 'completed',
          }),
          payments
            .aggregate<{ totalEarnings: number }>([
              { $match: { technicianEmail, paymentStatus: 'paid' } },
              { $group: { _id: null, totalEarnings: { $sum: '$amount' } } },
            ])
            .toArray(),
        ]);

      const totalServices = myServices.length;
      const approvedServices = myServices.filter(
        (s) => s.approvalStatus === 'approved'
      ).length;
      const pendingServices = myServices.filter(
        (s) => s.approvalStatus === 'pending'
      ).length;

      return sendSuccess(
        res,
        {
          services: myServices,
          stats: {
            totalServices,
            approvedServices,
            pendingServices,
            pendingRequests: pendingRequestsCount,
            activeJobs: activeJobsCount,
            completedJobs: completedJobsCount,
            totalEarnings: revenueAgg[0]?.totalEarnings || 0,
          },
        },
        'Technician services retrieved successfully.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/services
 * Public (Challenge 1 & Challenge 4):
 * Server-side search, category filter, serviceMode filter, sorting, and MongoDB skip/limit pagination.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { services } = getCollections();

    const search =
      typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const category =
      typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const serviceMode =
      typeof req.query.serviceMode === 'string'
        ? req.query.serviceMode.trim()
        : '';
    const sortParam =
      typeof req.query.sort === 'string' ? req.query.sort.trim() : 'newest';

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(String(req.query.limit || '9'), 10) || 9)
    );
    const skip = (page - 1) * limit;

    const filter: Filter<ServiceDocument> = {
      approvalStatus: 'approved',
      isAvailable: true,
    };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { title: regex },
        { category: regex as unknown as ServiceDocument['category'] },
        { description: regex },
        { serviceArea: regex },
        { technicianName: regex },
      ];
    }

    if (category && category.toLowerCase() !== 'all') {
      filter.category = category as ServiceDocument['category'];
    }

    if (serviceMode && serviceMode.toLowerCase() !== 'all') {
      filter.serviceMode = serviceMode as ServiceDocument['serviceMode'];
    }

    let sortQuery: Sort = { createdAt: -1 };
    if (sortParam === 'price_asc' || sortParam === 'asc') {
      sortQuery = { basePrice: 1, createdAt: -1 };
    } else if (sortParam === 'price_desc' || sortParam === 'desc') {
      sortQuery = { basePrice: -1, createdAt: -1 };
    } else {
      sortQuery = { createdAt: -1 };
    }

    const [items, total] = await Promise.all([
      services.find(filter).sort(sortQuery).skip(skip).limit(limit).toArray(),
      services.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return sendSuccess(
      res,
      items,
      'Services retrieved successfully.',
      200,
      {
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filters: {
          search,
          category: category || 'all',
          serviceMode: serviceMode || 'all',
          sort: sortParam,
        },
      }
    );
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/services/:id
 * Public: Get full service details + technician summary + reviews.
 * Returns 404 if the service does not exist or is not approved/available.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      throw new AppError('Service not found.', 404);
    }

    const { services, users, bookings } = getCollections();
    const service = await services.findOne({ _id: new ObjectId(id) });

    if (
      !service ||
      service.approvalStatus !== 'approved' ||
      !service.isAvailable
    ) {
      throw new AppError(
        'Service not found or is currently unavailable.',
        404
      );
    }

    const [technician, reviews] = await Promise.all([
      users.findOne(
        { email: service.technicianEmail.toLowerCase() },
        {
          projection: {
            name: 1,
            email: 1,
            image: 1,
            area: 1,
            bio: 1,
            phone: 1,
          },
        }
      ),
      bookings
        .find(
          {
            serviceId: service._id.toString(),
            rating: { $exists: true, $ne: undefined },
          },
          {
            projection: {
              customerName: 1,
              rating: 1,
              review: 1,
              reviewedAt: 1,
            },
          }
        )
        .sort({ reviewedAt: -1 })
        .limit(10)
        .toArray(),
    ]);

    const avgRating =
      reviews.length > 0
        ? Number(
            (
              reviews.reduce((acc, r) => acc + (r.rating || 0), 0) /
              reviews.length
            ).toFixed(1)
          )
        : null;

    return sendSuccess(
      res,
      {
        ...service,
        technician: technician || {
          name: service.technicianName,
          email: service.technicianEmail,
          image: '',
          area: service.serviceArea,
          bio: 'Verified FixMate Repair Specialist',
        },
        reviews,
        ratingSummary: {
          average: avgRating,
          count: reviews.length,
        },
      },
      'Service details retrieved successfully.'
    );
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/services
 * Protected (Technician): Create a new repair service with approvalStatus='pending' and isAvailable=true.
 */
router.post(
  '/',
  verifyToken,
  verifyTechnician,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createServiceSchema.parse(req.body);
      const { services } = getCollections();

      const newService: ServiceDocument = {
        title: parsed.title,
        category: parsed.category,
        description: parsed.description,
        image: parsed.image,
        basePrice: Number(parsed.basePrice),
        estimatedDuration: parsed.estimatedDuration,
        serviceMode: parsed.serviceMode,
        serviceArea: parsed.serviceArea,
        technicianName: req.user!.name,
        technicianEmail: req.user!.email,
        approvalStatus: 'pending',
        isAvailable: true,
        createdAt: new Date(),
      };

      const result = await services.insertOne(newService);

      return sendSuccess(
        res,
        {
          ...newService,
          _id: result.insertedId,
        },
        'Service submitted successfully and is waiting for admin approval.',
        201
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * PATCH /api/services/:id
 * Protected (Technician): Edit an owned service or toggle availability.
 * When service details are edited, approvalStatus automatically resets to 'pending'.
 */
router.patch(
  '/:id',
  verifyToken,
  verifyTechnician,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        throw new AppError('Invalid service ID.', 400);
      }

      const parsed = updateServiceSchema.parse(req.body);
      const { services } = getCollections();

      const existing = await services.findOne({ _id: new ObjectId(id) });
      if (!existing) {
        throw new AppError('Service not found.', 404);
      }

      if (
        existing.technicianEmail.toLowerCase() !== req.user!.email.toLowerCase()
      ) {
        throw new AppError(
          'Forbidden: You can only modify services that you own.',
          403
        );
      }

      const contentKeys = [
        'title',
        'category',
        'description',
        'image',
        'basePrice',
        'estimatedDuration',
        'serviceMode',
        'serviceArea',
      ] as const;

      const isContentEdited = contentKeys.some(
        (key) => parsed[key] !== undefined
      );

      const updateFields: Partial<ServiceDocument> = {};
      if (parsed.title !== undefined) updateFields.title = parsed.title;
      if (parsed.category !== undefined) updateFields.category = parsed.category;
      if (parsed.description !== undefined)
        updateFields.description = parsed.description;
      if (parsed.image !== undefined) updateFields.image = parsed.image;
      if (parsed.basePrice !== undefined)
        updateFields.basePrice = Number(parsed.basePrice);
      if (parsed.estimatedDuration !== undefined)
        updateFields.estimatedDuration = parsed.estimatedDuration;
      if (parsed.serviceMode !== undefined)
        updateFields.serviceMode = parsed.serviceMode;
      if (parsed.serviceArea !== undefined)
        updateFields.serviceArea = parsed.serviceArea;
      if (parsed.isAvailable !== undefined)
        updateFields.isAvailable = parsed.isAvailable;

      // Assignment Rule: When editing a service, approvalStatus must return to 'pending'
      if (isContentEdited) {
        updateFields.approvalStatus = 'pending';
        updateFields.technicianName = req.user!.name;
      }

      const updated = await services.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      return sendSuccess(
        res,
        updated,
        isContentEdited
          ? 'Service updated and returned to pending status for admin re-approval.'
          : `Service availability set to ${
              updated?.isAvailable ? 'Available' : 'Unavailable'
            }.`
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * DELETE /api/services/:id
 * Protected (Technician): Delete an owned service.
 */
router.delete(
  '/:id',
  verifyToken,
  verifyTechnician,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        throw new AppError('Invalid service ID.', 400);
      }

      const { services } = getCollections();
      const existing = await services.findOne({ _id: new ObjectId(id) });
      if (!existing) {
        throw new AppError('Service not found.', 404);
      }

      if (
        existing.technicianEmail.toLowerCase() !== req.user!.email.toLowerCase()
      ) {
        throw new AppError(
          'Forbidden: You can only delete services that you own.',
          403
        );
      }

      await services.deleteOne({ _id: new ObjectId(id) });

      return sendSuccess(
        res,
        { _id: id },
        'Service deleted successfully.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
