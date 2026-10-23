import 'server-only';
import { randomUUID } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { supabaseAdmin, buckets } from './supabase';

export type UploadKind = 'receipt' | 'product';

export const SIZE_LIMITS: Record<UploadKind, number> = {
  receipt: 5 * 1024 * 1024,
  product: 6 * 1024 * 1024,
};

const ALLOWED: Record<UploadKind, readonly string[]> = {
  receipt: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  product: ['image/jpeg', 'image/png', 'image/webp'],
};

export class UploadError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

function extFor(mime: string): string {
  switch (mime) {
    case 'application/pdf': return 'pdf';
    case 'image/jpeg': return 'jpg';
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    default: throw new UploadError('invalid_file', `Unsupported type: ${mime}`);
  }
}

export function bucketFor(kind: UploadKind): string {
  return kind === 'receipt' ? buckets.receipts : buckets.products;
}

/** The folder each upload kind lives in. Commit only accepts objects inside it. */
function folderFor(kind: UploadKind, entityId: string): string {
  return kind === 'receipt' ? `orders/${entityId}/` : `products/${entityId}/`;
}

export async function createSignedUpload(kind: UploadKind, entityId: string, mime: string, size: number) {
  if (!ALLOWED[kind].includes(mime)) throw new UploadError('invalid_file', 'File type not allowed');
  if (size <= 0 || size > SIZE_LIMITS[kind]) throw new UploadError('invalid_file', 'File too large');
  const path = `${folderFor(kind, entityId)}${Date.now()}-${randomUUID()}.${extFor(mime)}`;
  const bucket = bucketFor(kind);
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) throw new UploadError('sign_failed', error?.message ?? 'Sign failed');
  return { bucket, path: data.path, signedUrl: data.signedUrl };
}

/** Rejects any bucket/path the server did not issue for this kind and entity. */
export function isAllowedTarget(kind: UploadKind, entityId: string, bucket: string, path: string): boolean {
  if (bucket !== bucketFor(kind) || !path.startsWith(folderFor(kind, entityId)) || path.includes('..')) return false;
  return /^[0-9]+-[0-9a-f-]+\.(pdf|jpg|png|webp)$/.test(path.slice(path.lastIndexOf('/') + 1));
}

/**
 * Reads the uploaded object, checks its real type by magic bytes, and replaces it with a
 * normalized copy: images become WebP (max 1600px, EXIF/GPS stripped). Returns the stored path.
 * On any validation failure the uploaded object is deleted.
 */
export async function validateAndStore(kind: UploadKind, bucket: string, path: string): Promise<{ path: string; mime: string }> {
  const { data: blob, error } = await supabaseAdmin.storage.from(bucket).download(path);
  if (error || !blob) throw new UploadError('download_failed', 'Upload not found');
  const buf = Buffer.from(await blob.arrayBuffer());

  const reject = async (msg: string): Promise<never> => {
    await supabaseAdmin.storage.from(bucket).remove([path]);
    throw new UploadError('invalid_file', msg);
  };

  if (buf.length === 0 || buf.length > SIZE_LIMITS[kind]) return reject('Bad size');
  const detected = await fileTypeFromBuffer(buf);
  if (!detected || !ALLOWED[kind].includes(detected.mime)) return reject('Type not allowed');

  if (!detected.mime.startsWith('image/')) return { path, mime: detected.mime };

  const webp = await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const target = path.replace(/\.[a-z]+$/, '.webp');
  const { error: putError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(target, webp, { contentType: 'image/webp', upsert: target === path });
  if (putError) throw new UploadError('store_failed', putError.message);
  if (target !== path) await supabaseAdmin.storage.from(bucket).remove([path]);
  return { path: target, mime: 'image/webp' };
}

export function publicUrl(bucket: string, path: string): string {
  return supabaseAdmin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Removes a stored object given its public URL (used when a photo row is deleted). */
export async function removeByPublicUrl(url: string): Promise<void> {
  const marker = '/storage/v1/object/public/';
  const at = url.indexOf(marker);
  if (at === -1) return;
  const rest = url.slice(at + marker.length);
  const slash = rest.indexOf('/');
  if (slash <= 0) return;
  await supabaseAdmin.storage.from(rest.slice(0, slash)).remove([decodeURIComponent(rest.slice(slash + 1))]);
}
