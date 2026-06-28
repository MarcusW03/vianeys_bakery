import type { SiteConfig } from './types';

/**
 * Strips every reference to `url` from a config (featured images, gallery
 * categories, hero/about backgrounds). Used when an image is deleted from
 * the library so stale URLs don't keep rendering broken images. Pure
 * function with no server-only imports, so it's safe to use from both
 * client components and server route handlers.
 */
export function removeImageUrlFromConfig(config: SiteConfig, url: string): SiteConfig {
  return {
    ...config,
    featuredImageUrls: config.featuredImageUrls.filter((u) => u !== url),
    gallery: {
      categories: config.gallery.categories.map((cat) => ({
        ...cat,
        images: cat.images.filter((img) => img.url !== url),
      })),
    },
    hero: config.hero.imageUrl === url ? { ...config.hero, imageUrl: '' } : config.hero,
    about: config.about.imageUrl === url ? { ...config.about, imageUrl: '' } : config.about,
  };
}
