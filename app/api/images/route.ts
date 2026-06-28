import { getStorageAdapter } from '@/lib/storage';

export const runtime = 'nodejs';
// Always hit the storage adapter fresh — this list must reflect uploads/deletes
// made moments ago, so it must never be served from Next's route cache or a CDN edge cache.
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get('prefix') ?? undefined;
  const adapter = getStorageAdapter();
  // Always list recursively to find all images including those in subdirectories
  const images = await adapter.list(prefix, true);
  return Response.json(images);
}
