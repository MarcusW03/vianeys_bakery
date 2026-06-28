'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Popover from '@mui/material/Popover';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import PaletteIcon from '@mui/icons-material/Palette';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAdmin } from '@/lib/admin-context';
import type { SiteConfig } from '@/lib/config/types';
import ImagePicker from './ImagePicker';
import ManageSectionsDialog from './ManageSectionsDialog';

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

/** Floating bottom-right icon stack — the admin's entire command center,
 * separate from the Sidebar (which is purely customer-facing nav + the
 * inline-editable site name). Visibility per icon matches exactly what each
 * action's old Sidebar button required, just relocated. */
export default function AdminToolbar({ config }: { config: SiteConfig }) {
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
  } = useAdmin();

  const [imageLibraryOpen, setImageLibraryOpen] = useState(false);
  const [manageSectionsOpen, setManageSectionsOpen] = useState(false);
  const [paletteAnchor, setPaletteAnchor] = useState<HTMLElement | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const displayConfig = editMode && workingConfig ? workingConfig : config;
  const theme = displayConfig.theme;

  if (!isAdmin) return null;

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

  const iconSx = { color: 'var(--theme-accent)' };

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 'var(--page-gutter)',
          right: 'var(--page-gutter)',
          zIndex: 1201,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          p: 0.75,
          background: 'color-mix(in srgb, var(--theme-secondary) 55%, white 45%)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid color-mix(in srgb, var(--theme-primary) 18%, transparent)',
        }}
      >
        {!editMode ? (
          <Tooltip title="Edit Site" placement="left">
            <IconButton onClick={enterEditMode} sx={iconSx} aria-label="Edit Site">
              <EditIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Tooltip title={isSaving ? 'Saving…' : 'Save Changes'} placement="left">
              <IconButton onClick={handleSave} disabled={isSaving} sx={iconSx} aria-label="Save Changes">
                {isSaving ? <CircularProgress size={18} /> : <SaveIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Discard" placement="left">
              <IconButton onClick={discardChanges} disabled={isSaving} sx={iconSx} aria-label="Discard">
                <UndoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Manage Sections" placement="left">
              <IconButton onClick={() => setManageSectionsOpen(true)} sx={iconSx} aria-label="Manage Sections">
                <ViewQuiltIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Color Palette" placement="left">
              <IconButton
                onClick={(e) => setPaletteAnchor(e.currentTarget)}
                sx={iconSx}
                aria-label="Color Palette"
              >
                <PaletteIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
        <Tooltip title="Image Library" placement="left">
          <IconButton onClick={() => setImageLibraryOpen(true)} sx={iconSx} aria-label="Image Library">
            <PhotoLibraryIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Sign Out" placement="left">
          <IconButton onClick={() => signOut({ callbackUrl: '/' })} sx={iconSx} aria-label="Sign Out">
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Color palette popover — 3 reusable swatches used by the palette ── */
      /*    icon shown on each section in edit mode (see SectionStyleEditor). */}
      <Popover
        open={!!paletteAnchor}
        anchorEl={paletteAnchor}
        onClose={() => setPaletteAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 220 }}>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1 text-gray-500">
            Color Palette
          </p>
          <p className="text-[10px] mb-2 leading-snug text-gray-500">
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
              <span className="text-xs font-medium text-gray-700">{label}</span>
              <span className="ml-auto text-[10px] font-mono text-gray-400">{value}</span>
            </div>
          ))}
        </Box>
      </Popover>

      <ImagePicker
        open={imageLibraryOpen}
        onClose={() => setImageLibraryOpen(false)}
        onSelect={() => setImageLibraryOpen(false)}
        mode="manage"
      />

      {editMode && (
        <ManageSectionsDialog
          open={manageSectionsOpen}
          onClose={() => setManageSectionsOpen(false)}
          sections={displayConfig.sections}
        />
      )}

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
