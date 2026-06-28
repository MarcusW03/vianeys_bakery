'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import { useAdmin } from '@/lib/admin-context';
import ImagePicker from './ImagePicker';

export const SIDEBAR_WIDTH = 260;

const SECTIONS = [
  { label: 'Hero', anchor: 'hero' },
  { label: 'Our Work', anchor: 'featured' },
  { label: 'Gallery', anchor: 'gallery' },
  { label: 'Pricing', anchor: 'pricing' },
  { label: 'How to Order', anchor: 'how-to-order' },
  { label: 'About', anchor: 'about' },
  { label: 'Contact', anchor: 'contact' },
];

export default function AdminSidebar() {
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
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

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

  const scrollTo = (anchor: string) => {
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
  };

  const theme = workingConfig?.theme;

  return (
    <>
      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="caption" sx={{ opacity: 0.75, display: 'block', letterSpacing: 1 }}>
            ADMIN
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {workingConfig?.siteName ?? "Viáney's Bakery"}
          </Typography>
        </Box>

        {/* Edit Mode Controls */}
        <Box sx={{ p: 1.5 }}>
          {!editMode ? (
            <Button fullWidth variant="contained" startIcon={<EditIcon />} onClick={enterEditMode}>
              Edit Site
            </Button>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                startIcon={<UndoIcon />}
                onClick={discardChanges}
                disabled={isSaving}
              >
                Discard
              </Button>
            </Box>
          )}
        </Box>

        <Divider />

        {/* Section Navigation */}
        <Box sx={{ px: 0.5, py: 0.5 }}>
          <Typography
            variant="overline"
            sx={{ px: 1.5, color: 'text.secondary', fontSize: 10, display: 'block' }}
          >
            Page Sections
          </Typography>
          <List dense disablePadding>
            {SECTIONS.map((s) => (
              <ListItemButton key={s.anchor} onClick={() => scrollTo(s.anchor)} sx={{ borderRadius: 1 }}>
                <ListItemText primary={s.label} slotProps={{ primary: { variant: 'body2' } }} />
              </ListItemButton>
            ))}
          </List>
        </Box>

        {/* Brand Colors (edit mode only) */}
        {editMode && theme && (
          <>
            <Divider />
            <Box sx={{ p: 1.5 }}>
              <Typography
                variant="overline"
                sx={{ color: 'text.secondary', fontSize: 10, display: 'block', mb: 1 }}
              >
                Brand Colors
              </Typography>
              {[
                { label: 'Primary (buttons)', key: 'primaryColor', value: theme.primaryColor },
                { label: 'Secondary (backgrounds)', key: 'secondaryColor', value: theme.secondaryColor },
                { label: 'Accent (text/dark)', key: 'accentColor', value: theme.accentColor },
              ].map(({ label, key, value }) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => updateTheme({ [key]: e.target.value })}
                    style={{
                      width: 28,
                      height: 28,
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        <Divider />

        {/* Image Library + Logout */}
        <List dense disablePadding sx={{ p: 0.5 }}>
          <ListItemButton onClick={() => setImageLibraryOpen(true)} sx={{ borderRadius: 1 }}>
            <PhotoLibraryIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
            <ListItemText primary="Image Library" slotProps={{ primary: { variant: 'body2' } }} />
          </ListItemButton>
          <ListItemButton
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            sx={{ borderRadius: 1 }}
          >
            <LogoutIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
            <ListItemText primary="Logout" slotProps={{ primary: { variant: 'body2' } }} />
          </ListItemButton>
        </List>
      </Drawer>

      <ImagePicker
        open={imageLibraryOpen}
        onClose={() => setImageLibraryOpen(false)}
        onSelect={() => setImageLibraryOpen(false)}
        mode="manage"
      />

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
