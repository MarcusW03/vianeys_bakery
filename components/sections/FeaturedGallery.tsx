'use client';

import Image from 'next/image';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditableText from '@/components/admin/EditableText';
import EditableImage from '@/components/admin/EditableImage';
import SectionStyleEditor from '@/components/admin/SectionStyleEditor';
import { resolveStyleColor } from '@/lib/config/section-background';
import type { FeaturedContent } from '@/lib/config/types';
import type { SectionRendererProps } from '@/lib/sections/registry';

export default function FeaturedGallery({
  instance,
  editMode,
  onContentChange,
}: SectionRendererProps<FeaturedContent>) {
  const { imageUrls, sectionTitle } = instance.content;
  const style = instance.style;
  const headingColor = resolveStyleColor(style.heading, 'var(--theme-accent)');

  const nonEmpty = imageUrls.filter((u) => u);

  const handleChange = (index: number, url: string) => {
    const updated = [...imageUrls];
    updated[index] = url;
    onContentChange({ imageUrls: updated });
  };

  const handleAdd = () => onContentChange({ imageUrls: [...imageUrls, ''] });

  const handleRemove = (index: number) =>
    onContentChange({ imageUrls: imageUrls.filter((_, i) => i !== index) });

  if (!editMode && nonEmpty.length === 0) return null;

  return (
    <section
      id="featured"
      className={`py-20 px-6 ${editMode ? 'edit-mode-section-outline' : ''}`}
      style={{ backgroundColor: resolveStyleColor(style.background, 'var(--theme-secondary)') }}
    >
      {editMode && <SectionStyleEditor instanceId={instance.id} style={style} />}
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-3xl font-bold text-center mb-10"
          style={{ color: headingColor }}
        >
          <EditableText
            value={sectionTitle}
            onChange={(val) => onContentChange({ sectionTitle: val })}
          />
        </h2>

        {editMode ? (
          // ── Admin edit mode: flex-wrap so all images are visible at once ──
          <div className="flex flex-wrap justify-center gap-6">
            {(imageUrls.length > 0 ? imageUrls : ['']).map((url, i) => (
              <div
                key={i}
                className="relative w-48 h-48 flex-shrink-0 rounded-[var(--radius-md)] overflow-hidden group shadow-[var(--shadow-sm)]"
              >
                <EditableImage
                  src={url || ''}
                  alt={`Featured ${i + 1}`}
                  onImageChange={(newUrl) => handleChange(i, newUrl)}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
                <IconButton
                  size="small"
                  onClick={() => handleRemove(i)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    bgcolor: 'error.main',
                    color: 'white',
                    width: 24,
                    height: 24,
                    opacity: 0,
                    '.group:hover &': { opacity: 1 },
                    '&:hover': { bgcolor: 'error.dark' },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </div>
            ))}
            <Card
              variant="outlined"
              onClick={handleAdd}
              sx={{
                cursor: 'pointer',
                width: 192,
                height: 192,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: 'var(--theme-primary)',
                color: 'var(--theme-primary)',
                bgcolor: 'transparent',
                boxShadow: 'none',
                '&:hover': { opacity: 0.7 },
              }}
            >
              <AddIcon sx={{ fontSize: 36 }} />
            </Card>
          </div>
        ) : (
          // ── Customer view ──────────────────────────────────────────────────
          // Few images  → justify-center so they sit centred
          // Many images → overflow-x-auto with scroll-hidden to scroll smoothly
          // We use a container that is overflow-x-auto and an inner flex row.
          // `justify-center` on the inner row will center when there's room,
          // and will naturally overflow when there are too many images.
          <div className="overflow-x-auto scroll-hidden pb-2 -mx-6 px-6">
            <div
              className="flex gap-5 justify-center"
              // min-content width so the row can be wider than the viewport
              style={{ width: 'max-content', minWidth: '100%' }}
            >
              {nonEmpty.map((url, i) => (
                <div
                  key={i}
                  // relative is required for next/image fill
                  className="relative flex-shrink-0 rounded-[var(--radius-md)] overflow-hidden group shadow-[var(--shadow-sm)]"
                  style={{
                    width: 'clamp(220px, 28vw, 320px)',
                    height: 'clamp(220px, 28vw, 320px)',
                  }}
                >
                  <Image
                    src={url}
                    alt={`Featured creation ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 320px"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
