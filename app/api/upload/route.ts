import { auth } from '@/auth';
import { getStorageAdapter } from '@/lib/storage';

export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const folder = (form.get('folder') as string | null) ?? 'uploads';

  if (!(file instanceof File)) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { error: 'File type not allowed. Use JPEG, PNG, WebP, GIF, or AVIF.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'File exceeds 10 MB limit' }, { status: 400 });
  }

  const safeName = file.name
    .replace(/\.\./g, '_')
    .replace(/[^a-zA-Z0-9._\-]/g, '_');
  const pathname = `${folder}/${Date.now()}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const adapter = getStorageAdapter();
  const result = await adapter.upload(pathname, buffer, file.type);

  return Response.json(result);
}
