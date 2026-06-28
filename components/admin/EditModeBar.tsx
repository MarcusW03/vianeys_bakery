'use client';

import { useState } from 'react';
import Fab from '@mui/material/Fab';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import { useAdmin } from '@/lib/admin-context';

export default function EditModeBar() {
  const { isAdmin, editMode, isSaving, enterEditMode, saveChanges, discardChanges } = useAdmin();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  if (!isAdmin) return null;

  const handleSave = async () => {
    const result = await saveChanges();
    setSnackbar({
      open: true,
      message: result.ok ? 'Changes saved!' : (result.error ?? 'Save failed'),
      severity: result.ok ? 'success' : 'error',
    });
  };

  return (
    <>
      {/* View mode: floating Edit button */}
      {!editMode && (
        <Fab
          color="primary"
          variant="extended"
          onClick={enterEditMode}
          sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1300 }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Edit Site
        </Fab>
      )}

      {/* Edit mode: Save / Discard bar */}
      {editMode && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1300,
            display: 'flex',
            gap: 1,
            bgcolor: 'background.paper',
            boxShadow: 4,
            borderRadius: 3,
            px: 2,
            py: 1.5,
          }}
        >
          <Button
            variant="outlined"
            color="inherit"
            onClick={discardChanges}
            disabled={isSaving}
          >
            Discard
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            sx={{ minWidth: 90 }}
          >
            {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </Box>
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
