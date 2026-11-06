/**
 * Free image hosting via Cloudinary (Layer 2 of the traffic fix).
 *
 * Why: Firebase Storage's free tier allows only about 1 GB of downloads per
 * day. A busy fan site burns through that before noon, after which images
 * stop loading and admin uploads look "vanished". Cloudinary's free plan
 * (no payment card required) includes 25 GB of storage and 25 GB of
 * bandwidth per month, served over a CDN — far more headroom for images.
 *
 * SETUP (2 minutes, one time):
 * 1. Create a free account at https://cloudinary.com
 * 2. On the Dashboard, copy your "Cloud name".
 * 3. Go to Settings → Upload → "Add upload preset", set Signing Mode to
 *    "Unsigned", save it, and copy the preset name.
 * 4. Paste both values below — or set the environment variables
 *    VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET instead.
 *
 * Until both values are filled in, image uploads automatically use Firebase
 * Storage exactly as before. Nothing breaks while this is unconfigured.
 */
export const CLOUDINARY_CLOUD_NAME = '';
export const CLOUDINARY_UPLOAD_PRESET = '';

const metaEnv = (import.meta as any).env || {};

export const cloudinaryCloudName: string =
  metaEnv.VITE_CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME;
export const cloudinaryUploadPreset: string =
  metaEnv.VITE_CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET;

export function isCloudinaryConfigured(): boolean {
  return !!cloudinaryCloudName && !!cloudinaryUploadPreset;
}

/**
 * Upload an image blob to Cloudinary with an unsigned upload preset.
 * Returns the public HTTPS URL, or null when Cloudinary is not configured
 * or the upload fails — callers then fall back to Firebase Storage.
 */
export async function uploadImageToCloudinary(blob: Blob, filename: string): Promise<string | null> {
  if (!isCloudinaryConfigured()) return null;
  try {
    const form = new FormData();
    form.append('file', blob, filename);
    form.append('upload_preset', cloudinaryUploadPreset);
    form.append('folder', 'bangtan-gallery');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
      method: 'POST',
      body: form
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.secure_url || null;
  } catch {
    return null;
  }
}
