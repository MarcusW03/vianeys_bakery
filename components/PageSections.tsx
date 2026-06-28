'use client';

import { useEffect } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { useThemeColors } from '@/components/DynamicThemeProvider';
import type { SiteConfig } from '@/lib/config/types';
import { SECTION_REGISTRY } from '@/lib/sections/registry';
import Sidebar from '@/components/admin/Sidebar';
import AdminToolbar from '@/components/admin/AdminToolbar';

interface PageSectionsProps {
  initialConfig: SiteConfig;
  adminName?: string;
}

export default function PageSections({ initialConfig, adminName }: PageSectionsProps) {
  const { editMode, workingConfig, lastSavedConfig, updateSectionContent } = useAdmin();
  const { setThemeColors } = useThemeColors();
  // Prefer (in order): live edits, the config from the last successful save
  // (so Save doesn't visually "lose" the change while router.refresh()'s
  // server round-trip is still in flight), then the server-rendered prop.
  const config = editMode && workingConfig ? workingConfig : lastSavedConfig ?? initialConfig;

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
    // Same idea for the sidebar width: only override the default fluid
    // clamp() when the admin has set one, and remove the override (falling
    // back to the CSS default) if they discard back to unset.
    if (config.sidebarWidthPx) {
      root.style.setProperty('--sidebar-width', `${config.sidebarWidthPx}px`);
    } else {
      root.style.removeProperty('--sidebar-width');
    }
  }, [config.theme, config.sidebarWidthPx]);

  return (
    // Flex row: sidebar + main content side by side on desktop.
    // On mobile the sidebar is a temporary overlay, so main takes full width.
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <Sidebar config={config} adminName={adminName} />
      <AdminToolbar config={config} />

      {/*
        MUI's permanent Drawer renders a `flex: 0 0 auto` wrapper div around
        the (visually fixed-position) Paper — that wrapper takes up real
        space in this flex row, so it already pushes `main` over by exactly
        calc(var(--sidebar-width) + var(--page-gutter)) on its own (Sidebar.tsx
        reserves that extra gutter so main clears the floating/inset Paper
        with a matching gap on both sides). Do NOT also add a marginLeft/offset
        class here — that double-counts the width and creates a huge gap.
        On mobile the sidebar's wrapper is hidden (width 0), so main is full width.
      */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--page-gutter)',
          padding: 'var(--page-gutter)',
        }}
        className="w-full"
      >
        {config.sections.map((instance) => {
          if (!editMode && instance.hidden) return null;
          const def = SECTION_REGISTRY[instance.type];
          if (!def) return null;
          return (
            <def.Renderer
              key={instance.id}
              instance={instance}
              editMode={editMode}
              onContentChange={(patch) => updateSectionContent(instance.id, patch)}
              allSections={config.sections}
            />
          );
        })}
      </main>
    </div>
  );
}
