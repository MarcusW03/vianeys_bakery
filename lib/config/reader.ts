import fs from 'fs/promises';
import path from 'path';
import { cache } from 'react';
import type { SiteConfig } from './types';
import { defaultConfig } from './defaults';

const LOCAL_CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json');

/** Migrates old contact format to new links format */
function migrateContactFormat(contact: any): any {
  if (!contact) return { ...defaultConfig.contact };
  
  // If already in new format with links array, use as-is
  if (Array.isArray(contact.links)) {
    return contact;
  }

  // Old format with separate fields: phone, email, instagram, facebook, messenger
  const links = [];
  const fieldMap: Record<string, string> = {
    phone: 'Call us',
    email: 'Email',
    instagram: 'Instagram',
    facebook: 'Facebook',
    messenger: 'Messenger',
  };

  for (const [key, label] of Object.entries(fieldMap)) {
    const value = contact[key];
    if (value) {
      let url = value;
      if (key === 'phone' && !value.startsWith('tel:')) {
        url = `tel:${value}`;
      } else if (key === 'email' && !value.startsWith('mailto:')) {
        url = `mailto:${value}`;
      } else if (key === 'instagram') {
        url = value.startsWith('http') ? value : `https://instagram.com/${value.replace(/^@/, '')}`;
      } else if (key === 'facebook') {
        url = value.startsWith('http') ? value : `https://facebook.com/${value.replace(/^@/, '')}`;
      } else if (key === 'messenger') {
        url = value.startsWith('http') ? value : `https://m.me/${value.replace(/^@/, '')}`;
      }
      links.push({ id: key, label, url });
    }
  }

  return {
    links: links.length > 0 ? links : defaultConfig.contact.links,
    location: contact.location || '',
  };
}

const OLD_TOKEN_TO_SLOT: Record<string, string> = {
  primary: 'color1',
  secondary: 'color2',
  accent: 'color3',
  white: '#ffffff',
};

/** Migrates the old `sectionStyles: Record<id, 'primary'|'secondary'|'accent'|'white'>`
 * shape to the current `Record<id, { background, heading, text }>` shape. */
function migrateSectionStyles(raw: any): SiteConfig['sectionStyles'] {
  if (!raw) return defaultConfig.sectionStyles;
  const migrated: Record<string, any> = {};
  for (const [sectionId, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      const bg = OLD_TOKEN_TO_SLOT[value] ?? value;
      const fallback = defaultConfig.sectionStyles?.[sectionId];
      migrated[sectionId] = { ...fallback, background: bg };
    } else {
      migrated[sectionId] = value;
    }
  }
  return { ...defaultConfig.sectionStyles, ...migrated };
}

/** Merges parsed JSON with defaults so new fields are always present in old configs */
function mergeWithDefaults(parsed: Partial<SiteConfig>): SiteConfig {
  return {
    ...defaultConfig,
    ...parsed,
    contact: migrateContactFormat(parsed.contact),
    sectionTitles: { ...defaultConfig.sectionTitles, ...parsed.sectionTitles },
    theme: { ...defaultConfig.theme, ...parsed.theme },
    sectionStyles: migrateSectionStyles(parsed.sectionStyles),
    sectionOrder: parsed.sectionOrder || defaultConfig.sectionOrder,
    hiddenSections: parsed.hiddenSections || defaultConfig.hiddenSections,
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

  const res = await fetch(blobs[0].url, { next: { revalidate: 60 } });
  if (!res.ok) return defaultConfig;
  return mergeWithDefaults(await res.json() as Partial<SiteConfig>);
});
