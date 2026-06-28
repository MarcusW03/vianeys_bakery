import { getStorageAdapter } from '@/lib/storage';

export const runtime = 'nodejs';
// Always hit the storage adapter fresh — this list must reflect uploads/deletes
// made moments ago, so it must never be served from Next's route cache or a CDN edge cache.
export const dynamic = 'force-dynamic';

// Keep in sync with the accepted MIME types in app/api/upload/route.ts.
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

function isImageFile(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get('prefix') ?? undefined;
  const adapter = getStorageAdapter();
  // Always list recursively to find all images including those in subdirectories
  const items = await adapter.list(prefix, true);
  // The storage adapter lists every blob/file in the store, including
  // non-image files that happen to share it (e.g. config.json lives in the
  // same flat Vercel Blob store as uploaded images) — filter those out.
  const images = items.filter((item) => isImageFile(item.pathname));
  return Response.json(images);
}
