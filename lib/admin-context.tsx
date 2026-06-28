'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import type {
  SiteConfig,
  HeroContent,
  AboutContent,
  ContactContent,
  GalleryCategory,
  PricingItem,
  SiteTheme,
  SectionStyle,
} from '@/lib/config/types';
import { removeImageUrlFromConfig } from '@/lib/config/utils';
import { DEFAULT_SECTION_STYLE } from '@/lib/config/section-background';

interface AdminContextValue {
  isAdmin: boolean;
  adminName?: string;
  editMode: boolean;
  workingConfig: SiteConfig | null;
  /** The config as of the last successful save, kept around so the page can
   * keep displaying it immediately after exiting edit mode — without
   * waiting on a server round-trip (router.refresh()) that may briefly lag
   * behind the write, e.g. due to CDN/edge propagation. */
  lastSavedConfig: SiteConfig | null;
  isSaving: boolean;
  /** Non-null when enterEditMode fetch fails */
  editModeError: string | null;
  enterEditMode: () => Promise<void>;
  exitEditMode: () => void;
  updateSiteName: (name: string) => void;
  updateHero: (patch: Partial<HeroContent>) => void;
  updateFeaturedImages: (urls: string[]) => void;
  updateGalleryCategory: (categoryId: string, patch: Partial<GalleryCategory>) => void;
  updatePricing: (patch: Partial<SiteConfig['pricing']>) => void;
  updateHowToOrder: (patch: Partial<SiteConfig['howToOrder']>) => void;
  updateAbout: (patch: Partial<AboutContent>) => void;
  updateContact: (patch: Partial<ContactContent>) => void;
  updateSectionTitles: (patch: Partial<SiteConfig['sectionTitles']>) => void;
  updateTheme: (patch: Partial<SiteTheme>) => void;
  updateSectionStyle: (sectionId: string, patch: Partial<SectionStyle>) => void;
  removeImageUrl: (url: string) => void;
  addPricingItem: () => void;
  removePricingItem: (id: string) => void;
  addGalleryCategory: () => void;
  removeGalleryCategory: (id: string) => void;
  reorderSections: (order: string[]) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  saveChanges: () => Promise<{ ok: boolean; error?: string }>;
  discardChanges: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({
  isAdmin,
  adminName,
  children,
}: {
  isAdmin: boolean;
  adminName?: string;
  children: React.ReactNode;
}) {
  const [editMode, setEditMode] = useState(false);
  const [workingConfig, setWorkingConfig] = useState<SiteConfig | null>(null);
  const [lastSavedConfig, setLastSavedConfig] = useState<SiteConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editModeError, setEditModeError] = useState<string | null>(null);

  // ── Enter edit mode — fetch fresh config with proper error handling ────────
  const enterEditMode = useCallback(async () => {
    setEditModeError(null);
    try {
      const res = await fetch('/api/config');
      if (!res.ok) {
        if (res.status === 401) {
          await signOut({ redirect: true, callbackUrl: '/' });
          return;
        }
        throw new Error(`Failed to load config (${res.status})`);
      }
      const fresh = (await res.json()) as SiteConfig;
      setWorkingConfig(fresh);
      setEditMode(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load site config';
      setEditModeError(msg);
      // Do NOT enter edit mode — workingConfig stays null so updates are safe no-ops
    }
  }, []);

  const exitEditMode = useCallback(() => {
    setEditMode(false);
    setWorkingConfig(null);
    setEditModeError(null);
  }, []);

  // ── Updaters ──────────────────────────────────────────────────────────────
  const updateSiteName = useCallback((name: string) => {
    setWorkingConfig((prev) => (prev ? { ...prev, siteName: name } : prev));
  }, []);

  const updateHero = useCallback((patch: Partial<HeroContent>) => {
    setWorkingConfig((prev) => (prev ? { ...prev, hero: { ...prev.hero, ...patch } } : prev));
  }, []);

  const updateFeaturedImages = useCallback((urls: string[]) => {
    setWorkingConfig((prev) => (prev ? { ...prev, featuredImageUrls: urls } : prev));
  }, []);

  const updateGalleryCategory = useCallback(
    (categoryId: string, patch: Partial<GalleryCategory>) => {
      setWorkingConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          gallery: {
            categories: prev.gallery.categories.map((c) =>
              c.id === categoryId ? { ...c, ...patch } : c,
            ),
          },
        };
      });
    },
    [],
  );

  const updatePricing = useCallback((patch: Partial<SiteConfig['pricing']>) => {
    setWorkingConfig((prev) =>
      prev ? { ...prev, pricing: { ...prev.pricing, ...patch } } : prev,
    );
  }, []);

  const updateHowToOrder = useCallback((patch: Partial<SiteConfig['howToOrder']>) => {
    setWorkingConfig((prev) =>
      prev ? { ...prev, howToOrder: { ...prev.howToOrder, ...patch } } : prev,
    );
  }, []);

  const updateAbout = useCallback((patch: Partial<AboutContent>) => {
    setWorkingConfig((prev) =>
      prev ? { ...prev, about: { ...prev.about, ...patch } } : prev,
    );
  }, []);

  const updateContact = useCallback((patch: Partial<ContactContent>) => {
    setWorkingConfig((prev) =>
      prev ? { ...prev, contact: { ...prev.contact, ...patch } } : prev,
    );
  }, []);

  const updateSectionTitles = useCallback((patch: Partial<SiteConfig['sectionTitles']>) => {
    setWorkingConfig((prev) =>
      prev ? { ...prev, sectionTitles: { ...prev.sectionTitles, ...patch } } : prev,
    );
  }, []);

  const updateTheme = useCallback((patch: Partial<SiteTheme>) => {
    setWorkingConfig((prev) =>
      prev ? { ...prev, theme: { ...prev.theme, ...patch } } : prev,
    );
  }, []);

  const updateSectionStyle = useCallback((sectionId: string, patch: Partial<SectionStyle>) => {
    setWorkingConfig((prev) => {
      if (!prev) return prev;
      const current = prev.sectionStyles?.[sectionId] ?? DEFAULT_SECTION_STYLE;
      return {
        ...prev,
        sectionStyles: { ...prev.sectionStyles, [sectionId]: { ...current, ...patch } },
      };
    });
  }, []);

  const removeImageUrl = useCallback((url: string) => {
    setWorkingConfig((prev) => (prev ? removeImageUrlFromConfig(prev, url) : prev));
  }, []);

  const addPricingItem = useCallback(() => {
    setWorkingConfig((prev) => {
      if (!prev) return prev;
      const newItem: PricingItem = {
        id: `item-${Date.now()}`,
        name: 'New Item',
        description: 'Add a description',
        priceRange: 'Price TBD',
      };
      return { ...prev, pricing: { ...prev.pricing, items: [...prev.pricing.items, newItem] } };
    });
  }, []);

  const removePricingItem = useCallback((id: string) => {
    setWorkingConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pricing: { ...prev.pricing, items: prev.pricing.items.filter((it) => it.id !== id) },
      };
    });
  }, []);

  const addGalleryCategory = useCallback(() => {
    setWorkingConfig((prev) => {
      if (!prev) return prev;
      const newCat: GalleryCategory = {
        id: `cat-${Date.now()}`,
        name: 'New Category',
        images: [],
      };
      return { ...prev, gallery: { categories: [...prev.gallery.categories, newCat] } };
    });
  }, []);

  const removeGalleryCategory = useCallback((id: string) => {
    setWorkingConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        gallery: { categories: prev.gallery.categories.filter((c) => c.id !== id) },
      };
    });
  }, []);

  const reorderSections = useCallback((order: string[]) => {
    setWorkingConfig((prev) => (prev ? { ...prev, sectionOrder: order } : prev));
  }, []);

  const toggleSectionVisibility = useCallback((sectionId: string) => {
    setWorkingConfig((prev) => {
      if (!prev) return prev;
      const current = prev.hiddenSections ?? [];
      const next = current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId];
      return { ...prev, hiddenSections: next };
    });
  }, []);

  const saveChanges = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!workingConfig) return { ok: false, error: 'No changes to save' };
    setIsSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workingConfig),
      });
      if (!res.ok) {
        if (res.status === 401) {
          await signOut({ redirect: true, callbackUrl: '/' });
          return { ok: false, error: 'Session expired. Please sign in again.' };
        }
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: (data as { error?: string }).error ?? 'Save failed' };
      }
      // Keep the just-saved data displayable immediately — don't wait on
      // router.refresh()'s server round-trip, which can lag behind the write.
      setLastSavedConfig(workingConfig);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error — check your connection and try again.' };
    } finally {
      setIsSaving(false);
    }
  }, [workingConfig]);

  const discardChanges = useCallback(() => {
    exitEditMode();
  }, [exitEditMode]);

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        adminName,
        editMode,
        workingConfig,
        lastSavedConfig,
        isSaving,
        editModeError,
        enterEditMode,
        exitEditMode,
        updateSiteName,
        updateHero,
        updateFeaturedImages,
        updateGalleryCategory,
        updatePricing,
        updateHowToOrder,
        updateAbout,
        updateContact,
        updateSectionTitles,
        updateTheme,
        updateSectionStyle,
        removeImageUrl,
        addPricingItem,
        removePricingItem,
        addGalleryCategory,
        removeGalleryCategory,
        reorderSections,
        toggleSectionVisibility,
        saveChanges,
        discardChanges,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
  return ctx;
}
