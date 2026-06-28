import fs from 'fs/promises';
import path from 'path';
import { cache } from 'react';
import type { SiteConfig } from './types';
import { defaultConfig } from './defaults';

const LOCAL_CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json');

/** Merges parsed JSON with defaults so new fields are always present in old configs */
function mergeWithDefaults(parsed: Partial<SiteConfig>): SiteConfig {
  return {
    ...defaultConfig,
    ...parsed,
    theme: { ...defaultConfig.theme, ...parsed.theme },
    sections: parsed.sections ?? defaultConfig.sections,
  };
}

// Deduped per-request: both the root layout (for SSR theme vars) and the page
// component call getConfig(); cache() ensures that's one disk/blob read, not two.
export const getConfig = cache(async (): Promise<SiteConfig> => {
  if (process.env.STORAGE_PROVIDER === 'local') {
    try {
      const raw = await fs.readFile(LOCAL_CONFIG_PATH, 'utf-8');
      return mergeWithDefaults(JSON.parse(raw) as Partial<SiteConfig>);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return defaultConfig;
      }
      throw err;
    }
  }

  // Blob mode: find config.json in the blob store
  const { list } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: 'config.json', limit: 1 });

  if (blobs.length === 0) {
    return defaultConfig;
  }

  // saveConfig() overwrites config.json at this same URL on every save
  // (allowOverwrite: true). Vercel's Blob CDN caches by URL, so re-fetching
  // the bare URL right after a save can return stale, pre-save bytes even
  // though the write already succeeded. Appending the blob's own
  // `uploadedAt` (which changes on every overwrite, via list() — an
  // authenticated metadata call, not the cached public URL) busts that
  // cache: each save gets treated as a brand-new cache key.
  const cacheBustedUrl = `${blobs[0].url}?v=${new Date(blobs[0].uploadedAt).getTime()}`;
  const res = await fetch(cacheBustedUrl, { cache: 'no-store' });
  if (!res.ok) return defaultConfig;
  return mergeWithDefaults(await res.json() as Partial<SiteConfig>);
});
