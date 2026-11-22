import { apiFetch } from './api';

/**
 * Converts a File object to a base64 data URL and uploads it via ImgBB API
 * (either directly with NEXT_PUBLIC_IMGBB_API_KEY or via the backend /api/users/upload-image proxy).
 */
export async function uploadImageToImgBB(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (PNG, JPG, WEBP).');
  }

  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxBytes) {
    throw new Error('Image file size must be less than 5MB.');
  }

  const clientImgbbKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  if (
    clientImgbbKey &&
    !clientImgbbKey.startsWith('replace_with') &&
    clientImgbbKey.trim().length > 8
  ) {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(
        clientImgbbKey.trim()
      )}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const json = await res.json();
    if (res.ok && json?.success && json?.data?.display_url) {
      return json.data.display_url as string;
    }
  }

  // Convert File to base64 data URL and send through authenticated backend ImgBB service
  const base64DataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const uploaded = await apiFetch<{ url: string }>('/api/users/upload-image', {
    method: 'POST',
    body: JSON.stringify({
      imageBase64: base64DataUrl,
      name: file.name.replace(/\.[^/.]+$/, ''),
    }),
  });

  return uploaded.data.url;
}
