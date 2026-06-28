'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useAdmin } from '@/lib/admin-context';
import EditableImage from '@/components/admin/EditableImage';
import EditableText from '@/components/admin/EditableText';
import SectionStyleEditor from '@/components/admin/SectionStyleEditor';
import { resolveStyleColor, DEFAULT_SECTION_STYLE } from '@/lib/config/section-background';
import type { GalleryCategory, GalleryImage, SectionStyle } from '@/lib/config/types';

interface GallerySectionProps {
  categories: GalleryCategory[];
  sectionTitle: string;
  sectionStyle?: SectionStyle;
}

// Cell size in px — shared between desktop and mobile so math is consistent
const CELL = 200;

export default function GallerySection({ categories, sectionTitle, sectionStyle }: GallerySectionProps) {
  const style = sectionStyle ?? DEFAULT_SECTION_STYLE;
  const headingColor = resolveStyleColor(style.heading, 'var(--theme-accent)');
  const {
    editMode,
    updateGalleryCategory,
    updateSectionTitles,
    addGalleryCategory,
    removeGalleryCategory,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<GalleryCategory | null>(null);
  const [galleryRows, setGalleryRows] = useState(2);

  // Responsive row count for the customer-view scroll grid: 1 row on mobile,
  // 2 on tablet, 3 on desktop. Recomputed on resize, not just on mount.
  useEffect(() => {
    const computeRows = () => {
      const width = window.innerWidth;
      if (width < 640) return 1;
      if (width < 1024) return 2;
      return 3;
    };
    const update = () => setGalleryRows(computeRows());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Reset active tab + close lightbox when categories change
  useEffect(() => {
    if (activeTab !== 'all' && !categories.find((c) => c.id === activeTab)) {
      setActiveTab('all');
    }
  }, [categories, activeTab]);

  // Close lightbox when switching tabs (prevents wrong-index bug)
  useEffect(() => {
    setLightboxOpen(false);
  }, [activeTab]);

  const allImages = categories.flatMap((c) => c.images.filter((img) => img.url));
  const activeCategory =
    activeTab === 'all' ? null : categories.find((c) => c.id === activeTab);
  const currentImages =
    activeTab === 'all'
      ? allImages
      : (activeCategory?.images.filter((img) => img.url) ?? []);
  const slides = currentImages.map((img) => ({ src: img.url, alt: img.alt }));

  if (categories.length === 0 && !editMode) return null;

  const handleImageChange = (imgIndex: number, url: string) => {
    if (!activeCategory) return;
    const updated: GalleryImage[] = activeCategory.images.map((img, i) =>
      i === imgIndex ? { ...img, url } : img,
    );
    updateGalleryCategory(activeCategory.id, { images: updated });
  };

  const handleAddImage = () => {
    if (!activeCategory) return;
    const newImg: GalleryImage = {
      id: `img-${Date.now()}`,
      url: '',
      alt: '',
      featured: false,
    };
    updateGalleryCategory(activeCategory.id, {
      images: [...activeCategory.images, newImg],
    });
  };

  const handleRemoveImage = (imgIndex: number) => {
    if (!activeCategory) return;
    updateGalleryCategory(activeCategory.id, {
      images: activeCategory.images.filter((_, i) => i !== imgIndex),
    });
  };

  const handleDeleteCategory = (cat: GalleryCategory) => {
    if (cat.images.length > 0) {
      setDeleteConfirm(cat);
    } else {
      removeGalleryCategory(cat.id);
    }
  };

  // Images shown in the scroll grid (edit mode shows including empties)
  const gridImages =
    editMode && activeTab !== 'all'
      ? (activeCategory?.images ?? [])
      : currentImages;

  return (
    <section
      id="gallery"
      className={`py-20 px-6 ${editMode ? 'edit-mode-section-outline' : ''}`}
      style={{ backgroundColor: resolveStyleColor(style.background, '#ffffff') }}
    >
      {editMode && <SectionStyleEditor sectionId="gallery" style={style} />}
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-3xl font-bold text-center mb-8"
          style={{ color: headingColor }}
        >
          <EditableText
            value={sectionTitle}
            onChange={(val) => updateSectionTitles({ gallery: val })}
          />
        </h2>

        {/* ── Tab bar ── */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 4,
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v: string) => setActiveTab(v)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All" value="all" />
            {categories.map((cat) => (
              <Tab key={cat.id} value={cat.id} label={cat.name} />
            ))}
          </Tabs>

          {editMode && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" onClick={addGalleryCategory}>
                + Category
              </Button>
              {activeTab !== 'all' && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    const cat = categories.find((c) => c.id === activeTab);
                    if (cat) handleDeleteCategory(cat);
                  }}
                >
                  Delete
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* ── Image grid ── */}
        {/*
          Customer view: CSS grid with autoFlow:column so images fill
          left-to-right across columns, 2 rows on desktop, 1 row on mobile.
          Wrapped in overflow-x-auto so it scrolls horizontally when there
          are more images than fit on screen.

          Edit mode: simple flex-wrap so the admin can see and manage all images.
        */}
        {editMode ? (
          <div className="flex flex-wrap gap-3 justify-center">
            {gridImages.map((img, i) => (
              <div
                key={img.id}
                className="relative rounded-[var(--radius-md)] overflow-hidden group flex-shrink-0"
                style={{ width: CELL, height: CELL }}
              >
                {activeTab !== 'all' ? (
                  <>
                    <EditableImage
                      src={img.url}
                      alt={img.alt || `${activeCategory?.name ?? ''} ${i + 1}`}
                      onImageChange={(url) => handleImageChange(i, url)}
                      width={CELL}
                      height={CELL}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </>
                ) : img.url ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={img.url}
                      alt={img.alt || `Gallery ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes={`${CELL}px`}
                    />
                  </div>
                ) : null}
              </div>
            ))}

            {editMode && activeTab !== 'all' && (
              <button
                onClick={handleAddImage}
                className="rounded-[var(--radius-md)] border-2 border-dashed flex items-center justify-center text-3xl hover:opacity-70 transition-opacity flex-shrink-0"
                style={{
                  width: CELL,
                  height: CELL,
                  borderColor: 'var(--theme-primary)',
                  color: 'var(--theme-primary)',
                }}
              >
                +
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto scroll-hidden pb-3 -mx-6 px-6">
            {currentImages.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No images in this category yet.
              </Typography>
            ) : (
              /*
               * CSS grid with gridAutoFlow:column fills down first, then right.
               * gridTemplateRows sets how many rows tall the grid is — capped to
               * the number of images so a single image doesn't reserve empty
               * rows beneath it. Outer flex wrapper centers the grid when it's
               * narrower than the viewport, and scrolls when it's wider.
               */
              <div
                className="flex justify-center"
                style={{ width: 'max-content', minWidth: '100%' }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: `repeat(${Math.max(1, Math.min(galleryRows, currentImages.length))}, ${CELL}px)`,
                    gridAutoFlow: 'column',
                    gridAutoColumns: `${CELL}px`,
                    gap: 12,
                  }}
                >
                  {currentImages.map((img, i) => (
                    <div
                      key={img.id}
                      // relative is REQUIRED for next/image fill
                      className="relative rounded-[var(--radius-md)] overflow-hidden cursor-pointer group"
                      style={{ width: CELL, height: CELL }}
                      onClick={() => {
                        setLightboxIndex(i);
                        setLightboxOpen(true);
                      }}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt || `Gallery ${i + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes={`(max-width: 768px) 90vw, ${CELL}px`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={lightboxIndex}
      />

      {/* ── Delete category confirmation ── */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete &ldquo;{deleteConfirm?.name}&rdquo;?</DialogTitle>
        <DialogContent>
          <Typography>
            This category has {deleteConfirm?.images.length} image
            {(deleteConfirm?.images.length ?? 0) !== 1 ? 's' : ''}. Deleting it removes
            those images from the gallery (the files are kept). Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (deleteConfirm) removeGalleryCategory(deleteConfirm.id);
              setDeleteConfirm(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}
