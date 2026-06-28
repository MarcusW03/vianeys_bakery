'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import type { SiteConfig, SiteTheme, SectionStyle } from '@/lib/config/types';
import { removeImageUrlFromConfig } from '@/lib/config/utils';

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
  updateTheme: (patch: Partial<SiteTheme>) => void;
  updateSectionContent: (instanceId: string, patch: Record<string, unknown>) => void;
  updateSectionStyle: (instanceId: string, patch: Partial<SectionStyle>) => void;
  toggleSectionVisibility: (instanceId: string) => void;
  reorderSections: (newIdOrder: string[]) => void;
  removeImageUrl: (url: string) => void;
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

  const updateTheme = useCallback((patch: Partial<SiteTheme>) => {
    setWorkingConfig((prev) =>
      prev ? { ...prev, theme: { ...prev.theme, ...patch } } : prev,
    );
  }, []);

  const updateSectionContent = useCallback(
    (instanceId: string, patch: Record<string, unknown>) => {
      setWorkingConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((instance) =>
            instance.id === instanceId
              ? { ...instance, content: { ...(instance.content as object), ...patch } }
              : instance,
          ),
        };
      });
    },
    [],
  );

  const updateSectionStyle = useCallback((instanceId: string, patch: Partial<SectionStyle>) => {
    setWorkingConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((instance) =>
          instance.id === instanceId
            ? { ...instance, style: { ...instance.style, ...patch } }
            : instance,
        ),
      };
    });
  }, []);

  const removeImageUrl = useCallback((url: string) => {
    setWorkingConfig((prev) => (prev ? removeImageUrlFromConfig(prev, url) : prev));
  }, []);

  const reorderSections = useCallback((newIdOrder: string[]) => {
    setWorkingConfig((prev) => {
      if (!prev) return prev;
      const byId = new Map(prev.sections.map((s) => [s.id, s]));
      return { ...prev, sections: newIdOrder.map((id) => byId.get(id)!).filter(Boolean) };
    });
  }, []);

  const toggleSectionVisibility = useCallback((instanceId: string) => {
    setWorkingConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((instance) =>
          instance.id === instanceId ? { ...instance, hidden: !instance.hidden } : instance,
        ),
      };
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
        updateTheme,
        updateSectionContent,
        updateSectionStyle,
        removeImageUrl,
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
