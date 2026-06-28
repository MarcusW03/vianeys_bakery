import type { SiteConfig, SectionInstance } from './types';
import { SECTION_REGISTRY, DEFAULT_SECTION_ORDER } from '@/lib/sections/registry';

export const defaultConfig: SiteConfig = {
  siteName: "Vianey's Bakery",
  theme: {
    // A warm rose, not a flat gray — Color 1 drives every CTA button and
    // accent across the site, so it needs to read as an intentional brand
    // color rather than a placeholder.
    primaryColor: '#c2667a',
    secondaryColor: '#fff0fb',
    accentColor: '#997178',
  },
  sections: DEFAULT_SECTION_ORDER.map((type): SectionInstance => ({
    id: `${type}-1`,
    type,
    content: SECTION_REGISTRY[type].defaultContent,
    style: SECTION_REGISTRY[type].defaultStyle,
  })),
  lastUpdated: new Date().toISOString(),
};
