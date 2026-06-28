'use client';

import { useEffect } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { useThemeColors } from '@/components/DynamicThemeProvider';
import { DEFAULT_SECTION_STYLE } from '@/lib/config/section-background';
import type { SiteConfig } from '@/lib/config/types';
import HeroSection from '@/components/sections/HeroSection';
import FeaturedGallery from '@/components/sections/FeaturedGallery';
import GallerySection from '@/components/sections/GallerySection';
import PricingSection from '@/components/sections/PricingSection';
import HowToOrderSection from '@/components/sections/HowToOrderSection';
import AboutSection from '@/components/sections/AboutSection';
import ContactSection from '@/components/sections/ContactSection';
import Sidebar from '@/components/admin/Sidebar';

interface PageSectionsProps {
  initialConfig: SiteConfig;
  adminName?: string;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType<any>> = {
  hero: HeroSection,
  featured: FeaturedGallery,
  gallery: GallerySection,
  pricing: PricingSection,
  'how-to-order': HowToOrderSection,
  about: AboutSection,
  contact: ContactSection,
};

export default function PageSections({ initialConfig, adminName }: PageSectionsProps) {
  const { editMode, workingConfig } = useAdmin();
  const { setThemeColors } = useThemeColors();
  const config = editMode && workingConfig ? workingConfig : initialConfig;
  const order = config.sectionOrder ?? [
    'hero', 'featured', 'gallery', 'pricing', 'how-to-order', 'about', 'contact',
  ];
  const hidden = config.hiddenSections ?? [];

  // ── Apply theme CSS variables on every config change ──────────────────────
  // This runs both on mount (from server config) and whenever the admin
  // changes a color. Because section components reference var(--theme-*)
  // directly, this is the single source of truth for live theming.
  useEffect(() => {
    const { theme } = config;
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--theme-primary',   theme.primaryColor   ?? '#b5804e');
    root.style.setProperty('--theme-secondary', theme.secondaryColor ?? '#f5e6d3');
    root.style.setProperty('--theme-accent',    theme.accentColor    ?? '#3a2a1a');
    // Keep the MUI theme (Tabs, Buttons, etc. using color="primary") in sync too.
    setThemeColors({
      primaryColor: theme.primaryColor ?? '#b5804e',
      secondaryColor: theme.secondaryColor ?? '#f5e6d3',
      accentColor: theme.accentColor ?? '#3a2a1a',
    });
  }, [config.theme]);

  const styleFor = (sectionId: string) => config.sectionStyles?.[sectionId] ?? DEFAULT_SECTION_STYLE;

  const sectionProps: Record<string, Record<string, unknown>> = {
    hero: { data: config.hero, sectionStyle: styleFor('hero') },
    featured: {
      imageUrls: config.featuredImageUrls,
      sectionTitle: config.sectionTitles?.featured ?? 'Our Work',
      sectionStyle: styleFor('featured'),
    },
    gallery: {
      categories: config.gallery.categories,
      sectionTitle: config.sectionTitles?.gallery ?? 'Gallery',
      sectionStyle: styleFor('gallery'),
    },
    pricing: {
      headline: config.pricing.headline,
      items: config.pricing.items,
      sectionStyle: styleFor('pricing'),
    },
    'how-to-order': {
      headline: config.howToOrder.headline,
      steps: config.howToOrder.steps,
      sectionStyle: styleFor('how-to-order'),
    },
    about: { data: config.about, sectionStyle: styleFor('about') },
    contact: {
      data: config.contact,
      sectionTitle: config.sectionTitles?.contact ?? 'Get in Touch',
      sectionStyle: styleFor('contact'),
    },
  };

  return (
    // Flex row: sidebar + main content side by side on desktop.
    // On mobile the sidebar is a temporary overlay, so main takes full width.
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <Sidebar config={config} adminName={adminName} />

      {/*
        MUI's permanent Drawer renders a `flex: 0 0 auto` wrapper div around
        the (visually fixed-position) Paper — that wrapper takes up real
        space in this flex row, so it already pushes `main` over by exactly
        var(--sidebar-width) on its own. Do NOT also add a marginLeft/offset
        class here — that double-counts the width and creates a huge gap.
        On mobile the sidebar's wrapper is hidden (width 0), so main is full width.
      */}
      <main style={{ flex: 1 }} className="w-full">
        {order.map((sectionId) => {
          if (!editMode && hidden.includes(sectionId)) return null;
          const Component = SECTION_COMPONENTS[sectionId];
          if (!Component) return null;
          return <Component key={sectionId} {...sectionProps[sectionId]} />;
        })}
      </main>
    </div>
  );
}
