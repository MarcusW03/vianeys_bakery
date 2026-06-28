'use client';

import { useState, useRef } from 'react';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import EyeIcon from '@mui/icons-material/Visibility';
import EyeOffIcon from '@mui/icons-material/VisibilityOff';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useAdmin } from '@/lib/admin-context';
import type { SiteConfig } from '@/lib/config/types';
import { SECTION_REGISTRY, getInstanceLabel, getSectionAnchorId } from '@/lib/sections/registry';

interface SidebarProps {
  config: SiteConfig;
  adminName?: string;
}

// ─── Shared nav content rendered inside both the permanent and mobile drawers ─
// Purely customer-facing nav + the inline-editable site name — all admin
// tooling (Edit/Save/Discard, Manage Sections, Image Library, Color Palette,
// Sign Out) lives in AdminToolbar instead. The nav's own drag-reorder and
// per-item visibility toggle stay here since they manipulate these nav items
// directly, not generic admin tools.
interface NavContentProps {
  config: SiteConfig;
  adminName?: string;
  onClose?: () => void;
}

function NavContent({ config, adminName, onClose }: NavContentProps) {
  const {
    isAdmin,
    editMode,
    workingConfig,
    toggleSectionVisibility,
    reorderSections,
    updateSiteName,
  } = useAdmin();

  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  const displayConfig = editMode && workingConfig ? workingConfig : config;
  const sections = displayConfig.sections;

  // A section is "effectively empty" for a customer when its own component
  // would render null — asks the registry's declared isEmpty() rather than
  // special-casing type names here.
  const isEffectivelyEmpty = (instance: SiteConfig['sections'][number]): boolean =>
    SECTION_REGISTRY[instance.type]?.isEmpty?.(instance.content) ?? false;

  // Some section types (Hero) opt out of nav entirely — redundant as a link
  // for customers since it's the page's own top banner. Admins still see
  // every instance (incl. hidden/empty, dimmed) in edit mode so they can
  // reorder/hide/fill them like any other section.
  const navSections =
    isAdmin && editMode
      ? sections
      : sections.filter(
          (s) => SECTION_REGISTRY[s.type]?.showInNav !== false && !s.hidden && !isEffectivelyEmpty(s),
        );

  const scrollTo = (anchorId: string) => {
    onClose?.();
    // Small delay on mobile so the drawer can close first
    setTimeout(() => {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth' });
    }, onClose ? 200 : 0);
  };

  // ── Drag-to-reorder (insert, not swap) ────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, instanceId: string, label: string) => {
    setDraggedSection(instanceId);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('div');
    ghost.textContent = label;
    ghost.style.cssText =
      'position:absolute;left:-999px;padding:6px 14px;background:var(--theme-primary);color:#fff;border-radius:6px;font-size:13px;font-weight:600;pointer-events:none;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => ghost.remove(), 0);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSection(targetId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetId) {
      setDraggedSection(null);
      setDragOverSection(null);
      return;
    }
    const newOrder = sections.map((s) => s.id);
    const fromIdx = newOrder.indexOf(draggedSection);
    const toIdx = newOrder.indexOf(targetId);
    // Insert at target position (not swap)
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedSection);
    reorderSections(newOrder);
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
    setDragOverSection(null);
  };

  return (
    <>
      {/* ── Header ── */}
      <div className="px-3 py-3 flex flex-col gap-0.5">
        {isAdmin && (
          <span
            className="text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: 'color-mix(in srgb, var(--theme-accent) 55%, transparent)' }}
          >
            Admin · {adminName ?? 'Admin'}
          </span>
        )}
        {/* Site name — editable in edit mode */}
        {isAdmin && editMode ? (
          <TextField
            value={displayConfig.siteName}
            onChange={(e) => updateSiteName(e.target.value)}
            variant="standard"
            slotProps={{
              input: {
                style: {
                  color: 'var(--theme-accent)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '-0.01em',
                },
              },
            }}
            sx={{
              '& .MuiInput-underline:before': { borderBottomColor: 'color-mix(in srgb, var(--theme-accent) 30%, transparent)' },
              '& .MuiInput-underline:after': { borderBottomColor: 'color-mix(in srgb, var(--theme-accent) 80%, transparent)' },
            }}
          />
        ) : (
          <span
            className="font-bold text-base tracking-tight leading-snug"
            style={{ color: 'var(--theme-accent)' }}
          >
            {displayConfig.siteName}
          </span>
        )}
      </div>

      {/* ── Section navigation ── */}
      <nav className="flex-1 overflow-y-auto px-1.5 py-1.5 min-h-0">
        {isAdmin && editMode && (
          <p
            className="px-2 pb-1 text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: 'color-mix(in srgb, var(--theme-accent) 45%, transparent)' }}
          >
            Sections — drag to reorder
          </p>
        )}
        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {navSections.map((instance) => {
            const isHidden = !!instance.hidden;
            const title = getInstanceLabel(instance, sections);
            const isDragging = draggedSection === instance.id;
            const isOver = dragOverSection === instance.id;

            return (
              <ListItemButton
                key={instance.id}
                onClick={() => scrollTo(getSectionAnchorId(instance, sections))}
                draggable={editMode && isAdmin}
                onDragStart={(e) => handleDragStart(e, instance.id, title)}
                onDragOver={(e) => handleDragOver(e, instance.id)}
                onDrop={(e) => handleDrop(e, instance.id)}
                onDragEnd={handleDragEnd}
                disableGutters
                className="sidebar-item-hover"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--theme-accent)',
                  cursor: editMode && isAdmin ? 'grab' : 'pointer',
                  opacity: isDragging ? 0.4 : isHidden && editMode ? 0.45 : 1,
                  borderTop: '2px solid',
                  borderTopColor: isOver && !isDragging ? 'var(--theme-primary)' : 'transparent',
                  transition: 'opacity 0.15s, border-color 0.1s',
                }}
              >
                {editMode && isAdmin && (
                  <ListItemIcon sx={{ minWidth: 'auto' }}>
                    <DragIndicatorIcon
                      sx={{ fontSize: 14, opacity: 0.4, flexShrink: 0, pointerEvents: 'none' }}
                    />
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={title}
                  slotProps={{ primary: { noWrap: true, sx: { fontSize: 14, fontWeight: 500 } } }}
                  sx={{ flex: 1, minWidth: 0 }}
                />
                {editMode && isAdmin && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSectionVisibility(instance.id);
                    }}
                    sx={{
                      p: 0.25,
                      color: isHidden ? 'var(--theme-primary)' : 'inherit',
                      opacity: 0.6,
                      '&:hover': { opacity: 1 },
                    }}
                  >
                    {isHidden ? (
                      <EyeOffIcon sx={{ fontSize: 15 }} />
                    ) : (
                      <EyeIcon sx={{ fontSize: 15 }} />
                    )}
                  </IconButton>
                )}
              </ListItemButton>
            );
          })}
        </List>
      </nav>
    </>
  );
}

// ─── Main Sidebar export ───────────────────────────────────────────────────────
// Resize bounds for the desktop sidebar's drag handle — wide enough to be
// usable, narrow enough not to crowd out the page content.
const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 360;

export default function Sidebar({ config, adminName }: SidebarProps) {
  const { isAdmin, editMode, updateSidebarWidth } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);
  const paperContentRef = useRef<HTMLDivElement>(null);

  // ── Resize (desktop only, edit mode only) ──────────────────────────────────
  // Live-updates the CSS var directly during drag (like ColorSwatchInput's
  // live preview) instead of through React state on every mousemove tick —
  // commits to config only once, on release, so Save/Discard behave exactly
  // like every other edit.
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = paperContentRef.current?.getBoundingClientRect().width ?? 220;

    const clamp = (w: number) => Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, w));

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = clamp(startWidth + (moveEvent.clientX - startX));
      document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
    };
    const onMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      updateSidebarWidth(Math.round(clamp(startWidth + (upEvent.clientX - startX))));
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Width comes from the --sidebar-width CSS var (set once in globals.css as a
  // clamp(), not pinned here in JS) so it scales fluidly with the viewport
  // instead of jumping between fixed px values.
  //
  // Floating glass card: inset on all sides by --page-gutter (top/bottom/left
  // here; the temporary/mobile Drawer below adds `right` too since it isn't
  // anchored to the viewport edge the way the permanent one's reserved flex
  // space is). Rounded on every corner — no backdrop-filter blur, just a
  // tint + radius + elevated shadow reading as "glass".
  const drawerPaperBase = {
    width: 'var(--sidebar-width)',
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    // A floating rounded card reads as a card on all 4 edges, not just the
    // old flush-left single divider — the translucent tint alone was too
    // close to the page's own warm off-white to register as a distinct
    // surface at a glance.
    border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)',
    borderRadius: 'var(--radius-md)',
    // MUI's default Paper style sets an explicit height (100%, i.e. full
    // viewport for a fixed-position element) — with top AND bottom also
    // set, that over-constrains the box and CSS resolves it by ignoring
    // `bottom`, so the panel renders at a fixed full-viewport height and
    // overflows past the bottom inset instead of sizing dynamically.
    // `height: 'auto'` lets top+bottom imply the height instead.
    height: 'auto',
    top: 'var(--page-gutter)',
    bottom: 'var(--page-gutter)',
    left: 'var(--page-gutter)',
    boxShadow: 'var(--shadow-lg)',
  };

  // Desktop: floats in its own reserved gutter beside the page content —
  // nothing renders directly underneath it, so a translucent tint reads as
  // glass without hurting legibility.
  const drawerSx = {
    '& .MuiDrawer-paper': {
      ...drawerPaperBase,
      background: 'color-mix(in srgb, var(--theme-secondary) 45%, transparent)',
    },
  };

  // Mobile: a temporary overlay that genuinely sits on top of page content
  // (there's no gutter pushing main content out of the way) — the same
  // translucent tint let whatever was underneath show through and made the
  // nav hard to read, so this stays fully opaque instead.
  const mobileDrawerSx = {
    '& .MuiDrawer-paper': {
      ...drawerPaperBase,
      background: 'color-mix(in srgb, var(--theme-secondary) 55%, white 45%)',
    },
  };

  return (
    <>
      {/* ── Mobile hamburger button (customers on small screens) ── */}
      <IconButton
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        sx={{
          // Use sx's breakpoint object, not a Tailwind `md:hidden` className —
          // MUI's emotion-injected styles can land later in the stylesheet
          // than Tailwind's, so a plain utility class isn't guaranteed to
          // win the specificity tie and the button stayed visible on desktop.
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 50,
          width: 40,
          height: 40,
          boxShadow: 2,
          background: 'color-mix(in srgb, var(--theme-secondary) 90%, white)',
          border: '1px solid color-mix(in srgb, var(--theme-primary) 25%, transparent)',
          color: 'var(--theme-accent)',
          '&:hover': { background: 'color-mix(in srgb, var(--theme-secondary) 90%, white)' },
        }}
      >
        <MenuIcon sx={{ fontSize: 20 }} />
      </IconButton>

      {/* ── Mobile drawer (temporary, slides in) ── */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          ...mobileDrawerSx,
        }}
      >
        <div className="flex flex-col h-full">
          {/* Close button */}
          <div className="flex justify-end px-1.5 pt-1.5">
            <IconButton
              onClick={() => setMobileOpen(false)}
              size="small"
              sx={{ color: 'var(--theme-accent)', opacity: 0.6 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
          <NavContent
            config={config}
            adminName={adminName}
            onClose={() => setMobileOpen(false)}
          />
        </div>
      </Drawer>

      {/* ── Desktop permanent drawer ── */}
      <Drawer
        variant="permanent"
        anchor="left"
        slotProps={{
          paper: {
            // Same dashed treatment sections get in edit mode, so the
            // sidebar visibly reads as "selectable/resizable" too.
            className: editMode && isAdmin ? 'edit-mode-section-outline' : undefined,
          },
        }}
        sx={{
          display: { xs: 'none', md: 'block' },
          // Reserve sidebar width *plus* the floating gutter so `<main>`
          // (a sibling in the flex row) clears the inset/floating Paper with
          // a matching gap on both sides — the Paper itself stays
          // `var(--sidebar-width)` wide and insets by --page-gutter via
          // drawerSx's top/left/bottom, this just reserves the extra space.
          width: 'calc(var(--sidebar-width) + var(--page-gutter))',
          flexShrink: 0,
          ...drawerSx,
        }}
      >
        <div className="flex flex-col h-full relative" ref={paperContentRef}>
          <NavContent config={config} adminName={adminName} />
          {editMode && isAdmin && (
            <div
              onMouseDown={handleResizeStart}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar"
              className="absolute top-0 right-0 h-full"
              style={{
                width: 6,
                cursor: 'col-resize',
                background: 'color-mix(in srgb, var(--theme-primary) 25%, transparent)',
              }}
            />
          )}
        </div>
      </Drawer>
    </>
  );
}
