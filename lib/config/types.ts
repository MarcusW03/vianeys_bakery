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

export interface FeaturedContent {
  imageUrls: string[];
  sectionTitle: string;
}

export interface GalleryContent {
  categories: GalleryCategory[];
  sectionTitle: string;
}

export interface PricingContent {
  headline: string;
  items: PricingItem[];
}

export interface HowToOrderContent {
  headline: string;
  steps: OrderStep[];
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

export interface ContactSectionContent {
  links: ContactLink[];
  location: string;
  sectionTitle: string;
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

// One entry per section INSTANCE on the page. `id` is stable and independent
// of `type` — two Gallery instances are two different ids of type 'gallery'.
// `type` looks up the SectionDefinition in lib/sections/registry.ts.
export interface SectionInstance<TContent = unknown> {
  id: string;
  type: string;
  content: TContent;
  style: SectionStyle;
  hidden?: boolean;
}

export interface SiteConfig {
  siteName: string;
  theme: SiteTheme;
  sections: SectionInstance[];
  lastUpdated: string;
}
