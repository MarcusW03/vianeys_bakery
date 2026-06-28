'use client';

import Image from 'next/image';
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
                <button
                  onClick={() => handleRemove(i)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={handleAdd}
              className="w-48 h-48 rounded-[var(--radius-md)] border-2 border-dashed flex items-center justify-center text-4xl hover:opacity-80 transition-opacity flex-shrink-0"
              style={{
                borderColor: 'var(--theme-primary)',
                color: 'var(--theme-primary)',
              }}
            >
              +
            </button>
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
