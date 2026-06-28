'use client';

import { useState, useEffect, useRef } from 'react';
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
import EditableImage from '@/components/admin/EditableImage';
import EditableText from '@/components/admin/EditableText';
import SectionStyleEditor from '@/components/admin/SectionStyleEditor';
import AddTileCard from '@/components/sections/shared/AddTileCard';
import RemoveIconButton from '@/components/sections/shared/RemoveIconButton';
import { resolveStyleColor } from '@/lib/config/section-background';
import type { GalleryCategory, GalleryImage, GalleryContent } from '@/lib/config/types';
import { getSectionAnchorId } from '@/lib/sections/registry';
import type { SectionRendererProps } from '@/lib/sections/registry';

// Cell size in px — shared between desktop and mobile so math is consistent
const CELL = 200;

export default function GallerySection({
  instance,
  editMode,
  onContentChange,
  allSections,
}: SectionRendererProps<GalleryContent>) {
  const { categories, sectionTitle } = instance.content;
  const style = instance.style;
  const headingColor = resolveStyleColor(style.heading, 'var(--theme-accent)');

  const [activeTab, setActiveTab] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<GalleryCategory | null>(null);
  const [galleryRows, setGalleryRows] = useState(2);
  const [containerWidth, setContainerWidth] = useState(0);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const updateCategory = (categoryId: string, patch: Partial<GalleryCategory>) => {
    onContentChange({
      categories: categories.map((c) => (c.id === categoryId ? { ...c, ...patch } : c)),
    });
  };

  const addCategory = () => {
    const newCat: GalleryCategory = { id: `cat-${Date.now()}`, name: 'New Category', images: [] };
    onContentChange({ categories: [...categories, newCat] });
  };

  const removeCategory = (id: string) => {
    onContentChange({ categories: categories.filter((c) => c.id !== id) });
  };

  // Responsive row count for the customer-view grid: 1 row on mobile, 2 on
  // tablet, 3 on desktop. Recomputed on resize, not just on mount.
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

  // Measure available width so the grid knows how many columns fit per row
  // before it needs to wrap (or, past capacity, scroll instead).
  useEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
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
    updateCategory(activeCategory.id, { images: updated });
  };

  const handleAddImage = () => {
    if (!activeCategory) return;
    const newImg: GalleryImage = {
      id: `img-${Date.now()}`,
      url: '',
      alt: '',
    };
    updateCategory(activeCategory.id, {
      images: [...activeCategory.images, newImg],
    });
  };

  const handleRemoveImage = (imgIndex: number) => {
    if (!activeCategory) return;
    updateCategory(activeCategory.id, {
      images: activeCategory.images.filter((_, i) => i !== imgIndex),
    });
  };

  const handleDeleteCategory = (cat: GalleryCategory) => {
    if (cat.images.length > 0) {
      setDeleteConfirm(cat);
    } else {
      removeCategory(cat.id);
    }
  };

  // Images shown in the scroll grid (edit mode shows including empties)
  const gridImages =
    editMode && activeTab !== 'all'
      ? (activeCategory?.images ?? [])
      : currentImages;

  return (
    <section
      id={getSectionAnchorId(instance, allSections)}
      className={`py-20 px-6 rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-md)] ${editMode ? 'edit-mode-section-outline' : ''}`}
      style={{ backgroundColor: resolveStyleColor(style.background, '#ffffff') }}
    >
      {editMode && <SectionStyleEditor instanceId={instance.id} style={style} />}
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-3xl font-bold text-center mb-8"
          style={{ color: headingColor }}
        >
          <EditableText
            value={sectionTitle}
            onChange={(val) => onContentChange({ sectionTitle: val })}
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
              <Button size="small" variant="outlined" onClick={addCategory}>
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
                    <RemoveIconButton
                      onClick={() => handleRemoveImage(i)}
                      size={20}
                      iconSize={12}
                      top={4}
                      right={4}
                      ariaLabel="Remove image"
                    />
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
              <AddTileCard
                onClick={handleAddImage}
                ariaLabel="Add image"
                iconSize={28}
                sx={{ width: CELL, height: CELL, flexShrink: 0 }}
              />
            )}
          </div>
        ) : (
          <div
            ref={gridContainerRef}
            className="overflow-x-auto scroll-hidden pb-3 -mx-6 px-6"
          >
            {currentImages.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No images in this category yet.
              </Typography>
            ) : (
              (() => {
                const GAP = 12;
                // How many CELL-sized columns fit in the measured width — falls
                // back to 3 before the ResizeObserver's first measurement lands.
                const colsPerRow =
                  containerWidth > 0
                    ? Math.max(1, Math.floor((containerWidth + GAP) / (CELL + GAP)))
                    : 3;
                const capacity = colsPerRow * galleryRows;
                const needsScroll = currentImages.length > capacity;

                if (!needsScroll) {
                  // Fits within the row/column capacity: fill left-to-right,
                  // wrap downward (up to galleryRows), centered — no scrolling.
                  const cols = Math.min(colsPerRow, currentImages.length);
                  return (
                    <div className="flex justify-center">
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
                          gridAutoFlow: 'row',
                          gap: GAP,
                        }}
                      >
                        {currentImages.map((img, i) => (
                          <div
                            key={img.id}
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
                  );
                }

                // Past capacity: switch to filling columns first (galleryRows
                // tall) and let the row scroll horizontally for the overflow.
                return (
                  <div
                    className="flex justify-center"
                    style={{ width: 'max-content', minWidth: '100%' }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateRows: `repeat(${galleryRows}, ${CELL}px)`,
                        gridAutoFlow: 'column',
                        gridAutoColumns: `${CELL}px`,
                        gap: GAP,
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
                );
              })()
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
              if (deleteConfirm) removeCategory(deleteConfirm.id);
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
