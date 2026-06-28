'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import EditIcon from '@mui/icons-material/Edit';
import EyeIcon from '@mui/icons-material/Visibility';
import EyeOffIcon from '@mui/icons-material/VisibilityOff';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useAdmin } from '@/lib/admin-context';
import type { SiteConfig } from '@/lib/config/types';
import { SECTION_REGISTRY } from '@/lib/sections/registry';
import ImagePicker from './ImagePicker';


interface SidebarProps {
  config: SiteConfig;
  adminName?: string;
}

// ─── Color swatch that previews instantly but only commits to global state ────
// when the OS color picker actually closes (native 'change' event), instead of
// on every drag tick (React's onChange maps to the continuous 'input' event).
// This avoids a full MUI theme rebuild + CSS var write on every pixel of drag.
function ColorSwatchInput({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setLocal(value), [value]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const handleChange = (e: Event) => onCommit((e.target as HTMLInputElement).value);
    el.addEventListener('change', handleChange);
    return () => el.removeEventListener('change', handleChange);
  }, [onCommit]);

  return (
    <input
      ref={inputRef}
      type="color"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={(e) => onCommit(e.target.value)}
      className="w-9 h-9 rounded-[var(--radius-sm)] cursor-pointer border-0 p-0 block"
      style={{ outline: '2px solid color-mix(in srgb, var(--theme-accent) 20%, transparent)', outlineOffset: 1 }}
    />
  );
}

// ─── Shared nav content rendered inside both the permanent and mobile drawers ─
interface NavContentProps {
  config: SiteConfig;
  adminName?: string;
  onClose?: () => void;
}

function NavContent({ config, adminName, onClose }: NavContentProps) {
  const router = useRouter();
  const {
    isAdmin,
    editMode,
    isSaving,
    workingConfig,
    enterEditMode,
    exitEditMode,
    saveChanges,
    discardChanges,
    updateTheme,
    toggleSectionVisibility,
    reorderSections,
    updateSiteName,
  } = useAdmin();

  const [imageLibraryOpen, setImageLibraryOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  const displayConfig = editMode && workingConfig ? workingConfig : config;
  const sections = displayConfig.sections;
  const theme = displayConfig.theme;

  // A section is "effectively empty" for a customer when its own component
  // would render null — mirrors FeaturedGallery's/GallerySection's self-hide
  // checks so the nav link doesn't point at nothing.
  const isEffectivelyEmpty = (instance: SiteConfig['sections'][number]): boolean => {
    if (instance.type === 'featured') {
      return (instance.content as { imageUrls: string[] }).imageUrls.filter(Boolean).length === 0;
    }
    if (instance.type === 'gallery') {
      return (instance.content as { categories: unknown[] }).categories.length === 0;
    }
    return false;
  };

  // Hero is the page's own top banner — redundant as a nav link for customers.
  // Admins still see it (and hidden/empty sections, dimmed) in edit mode so
  // they can reorder/hide/fill them like any other section.
  const navSections =
    isAdmin && editMode
      ? sections
      : sections.filter((s) => s.type !== 'hero' && !s.hidden && !isEffectivelyEmpty(s));

  const handleSave = async () => {
    const result = await saveChanges();
    if (result.ok) {
      router.refresh();
      exitEditMode();
      setSnackbar({ open: true, message: 'Changes saved!', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: result.error ?? 'Save failed', severity: 'error' });
    }
  };

  const scrollTo = (sectionType: string) => {
    onClose?.();
    // Small delay on mobile so the drawer can close first
    setTimeout(() => {
      document.getElementById(sectionType)?.scrollIntoView({ behavior: 'smooth' });
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
      <div className="sidebar-header-bg px-4 py-4 flex flex-col gap-0.5">
        {isAdmin && (
          <span
            className="text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.5)' }}
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
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '-0.01em',
                },
              },
            }}
            sx={{
              '& .MuiInput-underline:before': { borderBottomColor: 'rgba(255,255,255,0.3)' },
              '& .MuiInput-underline:after': { borderBottomColor: 'rgba(255,255,255,0.8)' },
            }}
          />
        ) : (
          <span
            className="font-bold text-base tracking-tight leading-snug"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            {displayConfig.siteName}
          </span>
        )}
      </div>

      {/* ── Admin edit controls ── */}
      {isAdmin && (
        <div className="px-3 py-3 border-b" style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}>
          {!editMode ? (
            <button
              onClick={enterEditMode}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--theme-primary)' }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
              Edit Site
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{ background: 'var(--theme-primary)' }}
              >
                {isSaving ? (
                  <CircularProgress size={14} sx={{ color: 'white' }} />
                ) : (
                  <SaveIcon sx={{ fontSize: 15 }} />
                )}
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={discardChanges}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-80 disabled:opacity-50"
                style={{
                  background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)',
                  color: 'var(--theme-accent)',
                  border: '1px solid color-mix(in srgb, var(--theme-accent) 25%, transparent)',
                }}
              >
                <UndoIcon sx={{ fontSize: 15 }} />
                Discard
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Section navigation ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
        {isAdmin && editMode && (
          <p
            className="px-2 pb-1 text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: 'color-mix(in srgb, var(--theme-accent) 45%, transparent)' }}
          >
            Sections — drag to reorder
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {navSections.map((instance) => {
            const isHidden = !!instance.hidden;
            const def = SECTION_REGISTRY[instance.type];
            const label = def?.label ?? instance.type;
            const title = (instance.content as { sectionTitle?: string })?.sectionTitle ?? label;
            const isDragging = draggedSection === instance.id;
            const isOver = dragOverSection === instance.id;

            return (
              <li
                key={instance.id}
                draggable={editMode && isAdmin}
                onDragStart={(e) => handleDragStart(e, instance.id, title)}
                onDragOver={(e) => handleDragOver(e, instance.id)}
                onDrop={(e) => handleDrop(e, instance.id)}
                onDragEnd={handleDragEnd}
                style={{
                  opacity: isDragging ? 0.4 : isHidden && editMode ? 0.45 : 1,
                  borderTop: isOver && !isDragging
                    ? '2px solid var(--theme-primary)'
                    : '2px solid transparent',
                  transition: 'opacity 0.15s, border-color 0.1s',
                }}
              >
                <div className="sidebar-item-hover flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150">
                  <button
                    onClick={() => scrollTo(instance.type)}
                    className="flex-1 flex items-center gap-2 text-left min-w-0 bg-transparent border-0"
                    style={{ color: 'var(--theme-accent)', cursor: editMode && isAdmin ? 'grab' : 'pointer' }}
                  >
                    {editMode && isAdmin && (
                      <DragIndicatorIcon
                        sx={{ fontSize: 14, opacity: 0.4, flexShrink: 0, pointerEvents: 'none' }}
                      />
                    )}
                    <span className="flex-1 truncate">{title}</span>
                  </button>
                  {editMode && isAdmin && (
                    <IconButton
                      size="small"
                      onClick={() => toggleSectionVisibility(instance.id)}
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
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Color palette — 3 reusable swatches. Each section picks which of ── */
      /*    these (or a custom color) to use for its background/heading/text  */
      /*    via the small palette icon shown on the section itself in edit    */
      /*    mode — see SectionStyleEditor.                                    */}
      {isAdmin && editMode && theme && (
        <div
          className="px-3 py-3"
          style={{
            borderTop: '1px solid color-mix(in srgb, var(--theme-primary) 18%, transparent)',
          }}
        >
          <p
            className="text-[10px] font-semibold tracking-widest uppercase mb-1"
            style={{ color: 'color-mix(in srgb, var(--theme-accent) 45%, transparent)' }}
          >
            Color Palette
          </p>
          <p
            className="text-[10px] mb-2 leading-snug"
            style={{ color: 'color-mix(in srgb, var(--theme-accent) 45%, transparent)' }}
          >
            Used by the palette icon on each section to set its background, title, and text color.
          </p>
          {(
            [
              { label: 'Color 1', key: 'primaryColor', value: theme.primaryColor },
              { label: 'Color 2', key: 'secondaryColor', value: theme.secondaryColor },
              { label: 'Color 3', key: 'accentColor', value: theme.accentColor },
            ] as const
          ).map(({ label, key, value }) => (
            <div key={key} className="flex items-center gap-3 mb-2">
              <div className="relative flex-shrink-0">
                <ColorSwatchInput value={value} onCommit={(v) => updateTheme({ [key]: v })} />
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: 'color-mix(in srgb, var(--theme-accent) 70%, transparent)' }}
              >
                {label}
              </span>
              <span
                className="ml-auto text-[10px] font-mono"
                style={{ color: 'color-mix(in srgb, var(--theme-accent) 40%, transparent)' }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Admin footer: image library + logout ── */}
      {isAdmin && (
        <div
          className="px-2 py-2"
          style={{
            borderTop: '1px solid color-mix(in srgb, var(--theme-primary) 18%, transparent)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setImageLibraryOpen(true)}
            className="sidebar-item-hover w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={{ color: 'var(--theme-accent)' }}
          >
            <PhotoLibraryIcon sx={{ fontSize: 16, opacity: 0.6 }} />
            Image Library
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="sidebar-item-hover w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={{ color: 'var(--theme-accent)' }}
          >
            <LogoutIcon sx={{ fontSize: 16, opacity: 0.6 }} />
            Sign Out
          </button>
        </div>
      )}

      {/* ── Image picker (manage mode) ── */}
      {isAdmin && (
        <ImagePicker
          open={imageLibraryOpen}
          onClose={() => setImageLibraryOpen(false)}
          onSelect={() => setImageLibraryOpen(false)}
          mode="manage"
        />
      )}

      {/* ── Toast ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

// ─── Main Sidebar export ───────────────────────────────────────────────────────
export default function Sidebar({ config, adminName }: SidebarProps) {
  const { isAdmin } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Width comes from the --sidebar-width CSS var (set once in globals.css as a
  // clamp(), not pinned here in JS) so it scales fluidly with the viewport
  // instead of jumping between fixed px values.
  const drawerSx = {
    '& .MuiDrawer-paper': {
      width: 'var(--sidebar-width)',
      boxSizing: 'border-box' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
      border: 'none',
      // Theme-aware background applied via className on the inner content wrapper
      // but MUI paper needs background too:
      background: 'color-mix(in srgb, var(--theme-secondary) 55%, white 45%)',
      boxShadow: 'var(--shadow-md)',
      borderRight: '1px solid color-mix(in srgb, var(--theme-primary) 18%, transparent)',
      // No corner radius on the right edge — the sidebar sits flush against
      // page content there, so rounding it left a visible gap (page
      // background peeking through) between the curve and the content edge.
    },
  };

  return (
    <>
      {/* ── Mobile hamburger button (customers on small screens) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-full shadow-lg md:hidden"
        style={{
          background: 'color-mix(in srgb, var(--theme-secondary) 90%, white)',
          border: '1px solid color-mix(in srgb, var(--theme-primary) 25%, transparent)',
          color: 'var(--theme-accent)',
        }}
      >
        <MenuIcon sx={{ fontSize: 20 }} />
      </button>

      {/* ── Mobile drawer (temporary, slides in) ── */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          ...drawerSx,
        }}
      >
        <div className="flex flex-col h-full" style={{ background: 'color-mix(in srgb, var(--theme-secondary) 55%, white 45%)' }}>
          {/* Close button */}
          <div className="flex justify-end px-2 pt-2">
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
        sx={{
          display: { xs: 'none', md: 'block' },
          width: 'var(--sidebar-width)',
          flexShrink: 0,
          ...drawerSx,
        }}
      >
        <div className="flex flex-col h-full" style={{ background: 'color-mix(in srgb, var(--theme-secondary) 55%, white 45%)' }}>
          <NavContent config={config} adminName={adminName} />
        </div>
      </Drawer>
    </>
  );
}
