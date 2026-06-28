import type { ComponentType } from 'react';
import type {
  SectionInstance,
  SectionStyle,
  HeroContent,
  FeaturedContent,
  GalleryContent,
  PricingContent,
  HowToOrderContent,
  AboutContent,
  ContactSectionContent,
} from '@/lib/config/types';
import HeroSection from '@/components/sections/HeroSection';
import FeaturedGallery from '@/components/sections/FeaturedGallery';
import GallerySection from '@/components/sections/GallerySection';
import PricingSection from '@/components/sections/PricingSection';
import HowToOrderSection from '@/components/sections/HowToOrderSection';
import AboutSection from '@/components/sections/AboutSection';
import ContactSection from '@/components/sections/ContactSection';

export interface SectionRendererProps<TContent = unknown> {
  instance: SectionInstance<TContent>;
  editMode: boolean;
  onContentChange: (patch: Partial<TContent>) => void;
}

export interface SectionDefinition<TContent = unknown> {
  type: string;
  label: string;
  defaultContent: TContent;
  defaultStyle: SectionStyle;
  Renderer: ComponentType<SectionRendererProps<TContent>>;
  /** Whether a customer-facing nav (Sidebar) should ever link to this section.
   * Default true — Hero opts out since it's the page's own top banner. */
  showInNav?: boolean;
  /** Whether an instance with this content would render nothing on the
   * customer-facing page (e.g. no images yet) — used to dim/skip it in nav. */
  isEmpty?: (content: TContent) => boolean;
}

// The single place section types are declared — the renderer, defaults,
// labels, and (later) the "Add Section" picker all read from this generically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous map: each entry's TContent genuinely differs
export const SECTION_REGISTRY: Record<string, SectionDefinition<any>> = {
  hero: {
    type: 'hero',
    label: 'Hero',
    defaultContent: {
      headline: 'Handcrafted with Love',
      subtext: 'Custom cakes and pastries for every occasion. Made to order, made for you.',
      ctaText: 'How to order',
      imageUrl: '',
    } satisfies HeroContent,
    defaultStyle: { background: 'color3', heading: '#ffffff', text: '#1c1c1c' },
    Renderer: HeroSection,
    showInNav: false,
  },
  featured: {
    type: 'featured',
    label: 'Featured Gallery',
    defaultContent: {
      imageUrls: [],
      sectionTitle: 'My Work',
    } satisfies FeaturedContent,
    defaultStyle: { background: 'color2', heading: 'color3', text: 'color3' },
    Renderer: FeaturedGallery,
    isEmpty: (content: FeaturedContent) => content.imageUrls.filter(Boolean).length === 0,
  },
  gallery: {
    type: 'gallery',
    label: 'Gallery',
    defaultContent: {
      sectionTitle: 'Gallery',
      categories: [
        { id: 'wedding', name: 'Wedding Cakes', images: [] },
        { id: 'birthday', name: 'Birthday Cakes', images: [] },
        { id: 'cupcakes', name: 'Cupcakes', images: [] },
        { id: 'pastries', name: 'Pastries', images: [] },
      ],
    } satisfies GalleryContent,
    defaultStyle: { background: '#f7f7f7', heading: 'color3', text: 'color3' },
    Renderer: GallerySection,
    isEmpty: (content: GalleryContent) => content.categories.length === 0,
  },
  pricing: {
    type: 'pricing',
    label: 'Card Grid',
    defaultContent: {
      headline: 'Pricing',
      items: [
        {
          id: 'custom-cake',
          name: 'Small personalized Cake',
          description: 'Fully customized design, flavors, and fillings. Feds 10–50 guests.',
          priceRange: 'Starting at $85',
        },
        {
          id: 'wedding-cake',
          name: 'Wedding Cake',
          description: 'Multi-tier celebration cakes with premium ingredients and detailed decoration.',
          priceRange: 'Starting at $250',
        },
        {
          id: 'cupcakes',
          name: 'Cupcakes (dozen)',
          description: 'Custom flavored cupcakes with buttercream or fondant decorations.',
          priceRange: 'Starting at $36',
        },
        {
          id: 'pastry-box',
          name: 'Pastry Box',
          description: 'Assorted pastries — great for events, gifts, and celebrations.',
          priceRange: 'Starting at $45',
        },
      ],
    } satisfies PricingContent,
    defaultStyle: { background: 'color2', heading: '#ff9999', text: 'color3' },
    Renderer: PricingSection,
  },
  'how-to-order': {
    type: 'how-to-order',
    label: 'Numbered List',
    defaultContent: {
      headline: 'How to Order',
      steps: [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Reach Out',
          description: 'Contact us via Instagram, Facebook, or email to discuss your event and vision.',
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: 'Design Consultation',
          description: "We'll talk through flavors, design ideas, and sizing to create your perfect order.",
        },
        {
          id: 'step-3',
          stepNumber: 3,
          title: 'Confirm & Deposit',
          description: 'A 50% deposit secures your date. Orders are confirmed once deposit is received.',
        },
        {
          id: 'step-4',
          stepNumber: 4,
          title: 'Pick Up or Delivery',
          description: 'Your order will be ready on the agreed date. Local delivery available.',
        },
      ],
    } satisfies HowToOrderContent,
    defaultStyle: { background: '#e6e6e6', heading: 'color3', text: 'color3' },
    Renderer: HowToOrderSection,
  },
  about: {
    type: 'about',
    label: 'Image with Text',
    defaultContent: {
      headline: 'Made with Passion',
      body: "Hi, I'm Vianey! I've been baking custom cakes and pastries since 2015. Every order is made from scratch using quality ingredients — no shortcuts, no mixes. I love turning your ideas into edible art.",
      imageUrl: '',
    } satisfies AboutContent,
    defaultStyle: { background: '#ffffff', heading: 'color3', text: 'color3' },
    Renderer: AboutSection,
  },
  contact: {
    type: 'contact',
    label: 'Contact',
    defaultContent: {
      sectionTitle: 'Contact',
      links: [{ id: 'messenger', label: 'Messenger', url: '' }],
      location: '',
    } satisfies ContactSectionContent,
    defaultStyle: { background: 'color2', heading: 'color3', text: 'color3' },
    Renderer: ContactSection,
  },
};

export const DEFAULT_SECTION_ORDER = [
  'hero',
  'featured',
  'gallery',
  'pricing',
  'how-to-order',
  'about',
  'contact',
];

/** The admin-facing title baked into an instance's own content, if it has
 * one — different section types name this field differently (`sectionTitle`
 * for Featured/Gallery/Contact, `headline` for Pricing/HowToOrder/About/Hero)
 * so this checks both rather than assuming one field name. */
export function getInstanceContentTitle(instance: SectionInstance): string | undefined {
  const content = instance.content as { sectionTitle?: unknown; headline?: unknown };
  if (typeof content?.sectionTitle === 'string' && content.sectionTitle) return content.sectionTitle;
  if (typeof content?.headline === 'string' && content.headline) return content.headline;
  return undefined;
}

/** Human-readable label for one instance — prefers the instance's own
 * content title where one exists, otherwise falls back to the registry's
 * type label, disambiguated with "(n)" once a type has more than one
 * instance (e.g. a second Gallery section). */
export function getInstanceLabel(
  instance: SectionInstance,
  allSections: SectionInstance[],
): string {
  const contentTitle = getInstanceContentTitle(instance);
  if (contentTitle) return contentTitle;

  const def = SECTION_REGISTRY[instance.type];
  const label = def?.label ?? instance.type;
  const siblings = allSections.filter((s) => s.type === instance.type);
  if (siblings.length <= 1) return label;
  const index = siblings.findIndex((s) => s.id === instance.id) + 1;
  return `${label} (${index})`;
}
