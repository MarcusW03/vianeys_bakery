import { auth } from '@/auth';
import { getStorageAdapter } from '@/lib/storage';
import { getConfig } from '@/lib/config/reader';
import { saveConfig } from '@/lib/config/writer';
import { removeImageUrlFromConfig } from '@/lib/config/utils';

export const runtime = 'nodejs';

export async function DELETE(request: Request): Promise<Response> {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let url: string;
  try {
    const body = (await request.json()) as { url?: unknown };
    if (typeof body.url !== 'string' || !body.url) {
      return Response.json({ error: 'url is required' }, { status: 400 });
    }
    url = body.url;
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const adapter = getStorageAdapter();
  await adapter.delete(url);

  const config = await getConfig();
  const updated = removeImageUrlFromConfig(config, url);
  await saveConfig(updated);

  return new Response(null, { status: 204 });
}
