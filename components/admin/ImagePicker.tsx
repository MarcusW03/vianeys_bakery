'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { ListItem } from '@/lib/storage/types';
import { useAdmin } from '@/lib/admin-context';

interface ImagePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  /** 'pick' = click to select (default). 'manage' = view + delete only. */
  mode?: 'pick' | 'manage';
}

export default function ImagePicker({
  open,
  onClose,
  onSelect,
  mode = 'pick',
}: ImagePickerProps) {
  const { workingConfig, removeImageUrl } = useAdmin();
  const [images, setImages] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    url: string;
    usages: string[];
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch image list ───────────────────────────────────────────────────────
  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      // Every upload (see handleFileChange below) always goes to 'uploads/',
      // so scoping the list to that prefix lets the storage adapter filter
      // server-side instead of listing the entire store (which also holds
      // non-image objects like config.json) and filtering after the fact.
      const res = await fetch('/api/images?prefix=uploads', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load images');
      const data = (await res.json()) as ListItem[];
      setImages(data);
    } catch (err) {
      console.error('ImagePicker fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch every time the picker opens
  useEffect(() => {
    if (open) {
      fetchImages();
      setUploadError(null);
      setUploadSuccess(null);
      setDeleteError(null);
    }
  }, [open, fetchImages]);

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const form = new FormData();
    form.append('file', file);
    // Upload to a general folder so all images are discoverable
    form.append('folder', 'uploads');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setUploadError(
          (data as { error?: string }).error ?? 'Upload failed. Please try again.',
        );
        return;
      }
      const result = (await res.json()) as { url: string; pathname: string };

      // Prepend to local list immediately for instant feedback
      setImages((prev) => [{ url: result.url, pathname: result.pathname }, ...prev]);
      setUploadSuccess('Image uploaded successfully.');

      // In pick mode, auto-select the uploaded image and close
      if (mode === 'pick') {
        onSelect(result.url);
      }
      // In manage mode, stay open so the admin can see the new image
    } catch {
      setUploadError('Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Delete helpers ─────────────────────────────────────────────────────────
  const getInUseLocations = (url: string): string[] => {
    const cfg = workingConfig;
    if (!cfg) return [];
    const locs: string[] = [];
    for (const instance of cfg.sections) {
      if (instance.type === 'hero' && (instance.content as { imageUrl: string }).imageUrl === url) {
        locs.push('Hero background');
      }
      if (
        instance.type === 'image-with-text' &&
        (instance.content as { imageUrl: string }).imageUrl === url
      ) {
        locs.push('Image with Text section');
      }
      if (
        instance.type === 'featured-gallery' &&
        (instance.content as { imageUrls: string[] }).imageUrls.includes(url)
      ) {
        locs.push('Featured Gallery');
      }
      if (instance.type === 'gallery') {
        (instance.content as { categories: { name: string; images: { url: string }[] }[] }).categories.forEach(
          (cat) => {
            if (cat.images.some((img) => img.url === url)) locs.push(`Gallery: ${cat.name}`);
          },
        );
      }
    }
    return locs;
  };

  const handleDeleteClick = (url: string) => {
    setDeleteError(null);
    setDeleteTarget({ url, usages: getInUseLocations(url) });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      const res = await fetch('/api/images/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: deleteTarget.url }),
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      // Remove from local list and from the in-progress edit session, since the
      // server already stripped this URL from every section in the saved config.
      setImages((prev) => prev.filter((img) => img.url !== deleteTarget.url));
      removeImageUrl(deleteTarget.url);
      setDeleteTarget(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not delete image.';
      setDeleteError(msg);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      {/* ── Main dialog ── */}
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        aria-labelledby="image-picker-title"
      >
        <DialogTitle
          id="image-picker-title"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {mode === 'manage' ? 'Image Library' : 'Choose an Image'}
          <IconButton
            size="small"
            onClick={fetchImages}
            disabled={loading}
            title="Refresh"
            sx={{ ml: 1 }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Status messages */}
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError(null)}>
              {uploadError}
            </Alert>
          )}
          {uploadSuccess && (
            <Alert
              severity="success"
              icon={<CheckCircleIcon fontSize="inherit" />}
              sx={{ mb: 2 }}
              onClose={() => setUploadSuccess(null)}
            >
              {uploadSuccess}
            </Alert>
          )}
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError(null)}>
              {deleteError}
            </Alert>
          )}

          {uploading && <LinearProgress sx={{ mb: 2 }} />}

          {loading ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              Loading images…
            </Typography>
          ) : images.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No images uploaded yet. Use the button below to upload your first image.
            </Typography>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.url}
                  className="relative aspect-square rounded-lg overflow-hidden group"
                >
                  {mode === 'pick' ? (
                    <button
                      onClick={() => onSelect(img.url)}
                      className="w-full h-full outline-none block transition-all"
                      style={{ outline: 'none' }}
                      onFocus={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.boxShadow =
                          '0 0 0 2px var(--theme-primary)')
                      }
                      onBlur={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.boxShadow = '')
                      }
                    >
                      <div className="relative w-full h-full group-hover:ring-2 transition-all rounded-lg overflow-hidden"
                        style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}>
                        <Image
                          src={img.url}
                          alt={img.pathname}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          sizes="150px"
                        />
                      </div>
                    </button>
                  ) : (
                    <>
                      <div className="relative w-full h-full">
                        <Image
                          src={img.url}
                          alt={img.pathname}
                          fill
                          className="object-cover"
                          sizes="150px"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(img.url)}
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(180,0,0,0.7)',
                            '&:hover': { bgcolor: 'rgba(180,0,0,0.9)' },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Upload Image'}
          </Button>
          <Button onClick={onClose}>Close</Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={handleFileChange}
          />
        </DialogActions>
      </Dialog>

      {/* ── Delete confirmation dialog ── */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Image?</DialogTitle>
        <DialogContent>
          {deleteTarget?.usages && deleteTarget.usages.length > 0 ? (
            <Typography>
              This image is currently used in:{' '}
              <strong>{deleteTarget.usages.join(', ')}</strong>. Deleting it will leave
              those spots empty. Continue?
            </Typography>
          ) : (
            <Typography>Are you sure you want to permanently delete this image?</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
