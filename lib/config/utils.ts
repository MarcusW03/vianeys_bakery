import type { SiteConfig, HeroContent, AboutContent, FeaturedContent, GalleryContent } from './types';

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
    sections: config.sections.map((instance) => {
      switch (instance.type) {
        case 'hero':
        case 'about': {
          const content = instance.content as HeroContent | AboutContent;
          return content.imageUrl === url
            ? { ...instance, content: { ...content, imageUrl: '' } }
            : instance;
        }
        case 'featured': {
          const content = instance.content as FeaturedContent;
          return {
            ...instance,
            content: { ...content, imageUrls: content.imageUrls.filter((u) => u !== url) },
          };
        }
        case 'gallery': {
          const content = instance.content as GalleryContent;
          return {
            ...instance,
            content: {
              ...content,
              categories: content.categories.map((cat) => ({
                ...cat,
                images: cat.images.filter((img) => img.url !== url),
              })),
            },
          };
        }
        default:
          return instance;
      }
    }),
  };
}
