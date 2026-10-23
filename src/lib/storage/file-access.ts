import 'server-only';
import { supabaseAdmin, buckets } from './supabase';

const PUBLIC_MARKER = '/storage/v1/object/public/';

/**
 * Receipts live in a private bucket, so their stored public URL never loads. Returns a
 * 10-minute signed URL instead. Call only after checking the viewer may see this receipt.
 */
export async function signedReceiptUrl(fileUrl: string): Promise<string | null> {
  const at = fileUrl.indexOf(PUBLIC_MARKER);
  if (at === -1) return null;
  const rest = fileUrl.slice(at + PUBLIC_MARKER.length);
  const slash = rest.indexOf('/');
  if (slash <= 0 || rest.slice(0, slash) !== buckets.receipts) return null;
  const { data } = await supabaseAdmin.storage
    .from(buckets.receipts)
    .createSignedUrl(decodeURIComponent(rest.slice(slash + 1)), 600);
  return data?.signedUrl ?? null;
}
