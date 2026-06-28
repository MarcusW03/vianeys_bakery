import { auth } from '@/auth';
import { getConfig } from '@/lib/config/reader';
import { saveConfig } from '@/lib/config/writer';
import type { SiteConfig } from '@/lib/config/types';

export const runtime = 'nodejs';
// Must never be served from a route cache — admins need the freshly saved
// config the instant they re-enter edit mode, not a stale cached snapshot.
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const config = await getConfig();
  return Response.json(config);
}

export async function PUT(request: Request): Promise<Response> {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SiteConfig;
  try {
    body = (await request.json()) as SiteConfig;
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body?.siteName || !Array.isArray(body?.sections)) {
    return Response.json({ error: 'Invalid config structure' }, { status: 400 });
  }

  await saveConfig(body);

  return Response.json({ ok: true, lastUpdated: body.lastUpdated });
}
