import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import type { SiteConfig } from './types';

export { removeImageUrlFromConfig } from './utils';

const LOCAL_CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json');

export async function saveConfig(config: SiteConfig): Promise<void> {
  const updated: SiteConfig = {
    ...config,
    lastUpdated: new Date().toISOString(),
  };

  if (process.env.STORAGE_PROVIDER === 'local') {
    await fs.mkdir(path.dirname(LOCAL_CONFIG_PATH), { recursive: true });
    await fs.writeFile(LOCAL_CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    // Revalidate the full layout tree so every route picks up the new config
    revalidatePath('/', 'layout');
    return;
  }

  // Blob mode
  const { put } = await import('@vercel/blob');
  await put('config.json', JSON.stringify(updated, null, 2), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  });

  // Revalidate the full layout tree
  revalidatePath('/', 'layout');
}
