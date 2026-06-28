export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  featured: boolean;
}

export interface GalleryCategory {
  id: string;
  name: string;
  images: GalleryImage[];
}

export interface PricingItem {
  id: string;
  name: string;
  description: string;
  priceRange: string;
}

export interface OrderStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
}

export interface HeroContent {
  headline: string;
  subtext: string;
  ctaText: string;
  imageUrl: string;
}

export interface AboutContent {
  headline: string;
  body: string;
  imageUrl: string;
}

export interface ContactLink {
  id: string;
  label: string;
  url: string;
}

export interface ContactContent {
  links: ContactLink[];
  location: string;
}

export interface SiteTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

// "color1"/"color2"/"color3" reference the 3 reusable theme swatches (SiteTheme's
// primaryColor/secondaryColor/accentColor); any other string is a literal hex
// the admin picked with the custom color picker for that one spot.
export type ColorSlot = 'color1' | 'color2' | 'color3';
export interface SectionStyle {
  background: ColorSlot | string;
  heading: ColorSlot | string;
  text: ColorSlot | string;
}
export type SectionStyles = Record<string, SectionStyle>;

export interface SiteConfig {
  siteName: string;
  hero: HeroContent;
  featuredImageUrls: string[];
  gallery: {
    categories: GalleryCategory[];
  };
  pricing: {
    headline: string;
    items: PricingItem[];
  };
  howToOrder: {
    headline: string;
    steps: OrderStep[];
  };
  about: AboutContent;
  contact: ContactContent;
  sectionTitles: {
    featured: string;
    gallery: string;
    contact: string;
  };
  theme: SiteTheme;
  sectionStyles?: SectionStyles;
  sectionOrder?: string[];
  hiddenSections?: string[];
  lastUpdated: string;
}

export const SECTION_IDS = ['hero', 'featured', 'gallery', 'pricing', 'how-to-order', 'about', 'contact'] as const;
