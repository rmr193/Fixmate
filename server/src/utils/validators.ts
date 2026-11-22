import { z } from 'zod';

const SAFE_DATA_IMAGE_REGEX =
  /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i;

const MAX_DATA_URL_LENGTH = 7 * 1024 * 1024; // ~5MB decoded binary

export function isSafeImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('data:')) {
    return (
      trimmed.length <= MAX_DATA_URL_LENGTH &&
      SAFE_DATA_IMAGE_REGEX.test(trimmed)
    );
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const safeImageUrlSchema = z
  .string()
  .trim()
  .refine(
    isSafeImageUrl,
    'Image must be a valid HTTPS URL or a safe raster image (JPEG, PNG, WEBP, GIF).'
  );
