import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getCollections } from '../config/db';
import { env } from '../config/env';
import { signJwtToken, verifyToken } from '../middlewares/auth';
import { AppError, sendSuccess } from '../utils/apiResponse';

const router = Router();

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(80, 'Full name cannot exceed 80 characters.'),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone number is too long.')
    .optional()
    .default(''),
  area: z
    .string()
    .trim()
    .max(100, 'Area cannot exceed 100 characters.')
    .optional()
    .default(''),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio cannot exceed 500 characters.')
    .optional()
    .default(''),
  image: z.string().trim().optional(),
});

/**
 * GET /api/users/profile
 * Returns the authenticated user's profile.
 */
router.get(
  '/profile',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { users } = getCollections();
      const userDoc = await users.findOne({ email: req.user!.email });
      if (!userDoc) {
        throw new AppError('User not found.', 404);
      }

      return sendSuccess(res, {
        _id: (userDoc._id || userDoc.id || '').toString(),
        name: userDoc.name,
        email: userDoc.email,
        image: userDoc.image || '',
        role: userDoc.role || 'customer',
        phone: userDoc.phone || '',
        area: userDoc.area || '',
        bio: userDoc.bio || '',
        createdAt: userDoc.createdAt,
      });
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * PATCH /api/users/profile
 * Updates Name, Phone, Area, Bio, and Profile Photo for any logged-in user.
 * Email and Role cannot be modified through this endpoint.
 */
router.patch(
  '/profile',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateProfileSchema.parse(req.body);
      const { users, services } = getCollections();

      const updateFields: Record<string, unknown> = {
        name: parsed.name,
        phone: parsed.phone ?? '',
        area: parsed.area ?? '',
        bio: parsed.bio ?? '',
        updatedAt: new Date(),
      };

      if (parsed.image !== undefined && parsed.image.length > 0) {
        updateFields.image = parsed.image;
      }

      const result = await users.findOneAndUpdate(
        { email: req.user!.email },
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new AppError('User account not found.', 404);
      }

      // Keep technicianName in sync across their listed services
      if (result.role === 'technician' && parsed.name !== req.user!.name) {
        await services.updateMany(
          { technicianEmail: req.user!.email },
          { $set: { technicianName: parsed.name } }
        );
      }

      const token = signJwtToken({
        _id: (result._id || result.id || req.user!._id).toString(),
        email: result.email,
        role: result.role,
        name: result.name,
      });

      return sendSuccess(
        res,
        {
          token,
          user: {
            _id: (result._id || result.id || req.user!._id).toString(),
            name: result.name,
            email: result.email,
            image: result.image || '',
            role: result.role,
            phone: result.phone || '',
            area: result.area || '',
            bio: result.bio || '',
          },
        },
        'Profile updated successfully.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * POST /api/users/upload-image
 * Uploads an image via ImgBB API (or returns validated data URL fallback in local/offline environments).
 */
router.post(
  '/upload-image',
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { imageBase64, name } = req.body as {
        imageBase64?: string;
        name?: string;
      };

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        throw new AppError('Base64 image data is required.', 400);
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      if (
        env.IMGBB_API_KEY &&
        !env.IMGBB_API_KEY.startsWith('replace_with')
      ) {
        const formData = new URLSearchParams();
        formData.append('key', env.IMGBB_API_KEY);
        formData.append('image', cleanBase64);
        if (name) {
          formData.append('name', name);
        }

        const response = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });

        const json = (await response.json()) as {
          success?: boolean;
          data?: { display_url?: string; url?: string };
          error?: { message?: string };
        };

        if (response.ok && json.success && json.data) {
          return sendSuccess(
            res,
            {
              url: json.data.display_url || json.data.url,
              provider: 'imgbb',
            },
            'Image uploaded to ImgBB successfully.'
          );
        }
      }

      // Safe fallback when IMGBB_API_KEY is not provided in local testing
      const dataUrl = imageBase64.startsWith('data:image/')
        ? imageBase64
        : `data:image/jpeg;base64,${cleanBase64}`;

      return sendSuccess(
        res,
        {
          url: dataUrl,
          provider: 'data-url-fallback',
        },
        'Image processed successfully.'
      );
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
