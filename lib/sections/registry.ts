import type { ComponentType } from 'react';
import type {
  SectionInstance,
  SectionStyle,
  HeroContent,
  FeaturedGalleryContent,
  GalleryContent,
  CardGridContent,
  NumberedListContent,
  ImageWithTextContent,
  ContactSectionContent,
} from '@/lib/config/types';
import HeroSection from '@/components/sections/HeroSection';
import FeaturedGallerySection from '@/components/sections/FeaturedGallerySection';
import GallerySection from '@/components/sections/GallerySection';
import CardGridSection from '@/components/sections/CardGridSection';
import NumberedListSection from '@/components/sections/NumberedListSection';
import ImageWithTextSection from '@/components/sections/ImageWithTextSection';
import ContactSection from '@/components/sections/ContactSection';

export interface SectionRendererProps<TContent = unknown> {
  instance: SectionInstance<TContent>;
  editMode: boolean;
  onContentChange: (patch: Partial<TContent>) => void;
  /** Every section instance on the page, in order — for renderers (e.g. Hero's
   * CTA target picker) that need to reference a sibling section by id rather
   * than reaching into AdminContext directly. */
  allSections: SectionInstance[];
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
      // Matches defaults.ts's `${type}-1` id convention for the default page.
      ctaTargetId: 'numbered-list-1',
    } satisfies HeroContent,
    defaultStyle: { background: 'color3', heading: '#ffffff', text: '#1c1c1c' },
    Renderer: HeroSection,
    showInNav: false,
  },
  'featured-gallery': {
    type: 'featured-gallery',
    label: 'Featured Gallery',
    defaultContent: {
      imageUrls: [],
      sectionTitle: 'My Work',
    } satisfies FeaturedGalleryContent,
    defaultStyle: { background: 'color2', heading: 'color3', text: 'color3' },
    Renderer: FeaturedGallerySection,
    isEmpty: (content: FeaturedGalleryContent) => content.imageUrls.filter(Boolean).length === 0,
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
  'card-grid': {
    type: 'card-grid',
    label: 'Card Grid',
    defaultContent: {
      headline: 'Pricing',
      items: [
        {
          id: 'custom-cake',
          title: 'Small personalized Cake',
          description: 'Fully customized design, flavors, and fillings. Feds 10–50 guests.',
          badgeText: 'Starting at $85',
        },
        {
          id: 'wedding-cake',
          title: 'Wedding Cake',
          description: 'Multi-tier celebration cakes with premium ingredients and detailed decoration.',
          badgeText: 'Starting at $250',
        },
        {
          id: 'cupcakes',
          title: 'Cupcakes (dozen)',
          description: 'Custom flavored cupcakes with buttercream or fondant decorations.',
          badgeText: 'Starting at $36',
        },
        {
          id: 'pastry-box',
          title: 'Pastry Box',
          description: 'Assorted pastries — great for events, gifts, and celebrations.',
          badgeText: 'Starting at $45',
        },
      ],
    } satisfies CardGridContent,
    defaultStyle: { background: 'color2', heading: '#ff9999', text: 'color3' },
    Renderer: CardGridSection,
  },
  'numbered-list': {
    type: 'numbered-list',
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
    } satisfies NumberedListContent,
    defaultStyle: { background: '#e6e6e6', heading: 'color3', text: 'color3' },
    Renderer: NumberedListSection,
  },
  'image-with-text': {
    type: 'image-with-text',
    label: 'Image with Text',
    defaultContent: {
      headline: 'Made with Passion',
      body: "Hi, I'm Vianey! I've been baking custom cakes and pastries since 2015. Every order is made from scratch using quality ingredients — no shortcuts, no mixes. I love turning your ideas into edible art.",
      imageUrl: '',
    } satisfies ImageWithTextContent,
    defaultStyle: { background: '#ffffff', heading: 'color3', text: 'color3' },
    Renderer: ImageWithTextSection,
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
  'featured-gallery',
  'gallery',
  'card-grid',
  'numbered-list',
  'image-with-text',
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

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'section';
}

/** The `id` attribute a section renders with on the page, and what nav
 * links/anchors scroll to — derived from the instance's current label
 * (its own title where set, e.g. "How to Order" -> "how-to-order") rather
 * than its fixed type, so the anchor follows the admin's title edits and
 * reads as a real word in the URL instead of an internal type string. */
export function getSectionAnchorId(
  instance: SectionInstance,
  allSections: SectionInstance[],
): string {
  return slugify(getInstanceLabel(instance, allSections));
}
