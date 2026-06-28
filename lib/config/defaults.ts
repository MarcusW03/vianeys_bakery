import type { SiteConfig, SectionInstance } from './types';
import { SECTION_REGISTRY, DEFAULT_SECTION_ORDER } from '@/lib/sections/registry';

export const defaultConfig: SiteConfig = {
  siteName: "Vianey's Bakery",
  theme: {
    primaryColor: '#adadad',
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
