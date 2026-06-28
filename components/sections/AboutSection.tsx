'use client';

import Image from 'next/image';
import EditableText from '@/components/admin/EditableText';
import EditableImage from '@/components/admin/EditableImage';
import SectionStyleEditor from '@/components/admin/SectionStyleEditor';
import type { AboutContent } from '@/lib/config/types';
import { resolveStyleColor } from '@/lib/config/section-background';
import type { SectionRendererProps } from '@/lib/sections/registry';

export default function AboutSection({
  instance,
  editMode,
  onContentChange,
}: SectionRendererProps<AboutContent>) {
  const data = instance.content;
  const style = instance.style;
  const headingColor = resolveStyleColor(style.heading, 'var(--theme-accent)');
  const textColor = resolveStyleColor(style.text, '#4b5563');

  return (
    <section
      id="about"
      className={`py-20 px-6 ${editMode ? 'edit-mode-section-outline' : ''}`}
      style={{ backgroundColor: resolveStyleColor(style.background, '#ffffff') }}
    >
      {editMode && <SectionStyleEditor instanceId={instance.id} style={style} />}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Image */}
        <div
          className="relative aspect-square rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-sm)]"
          style={{ backgroundColor: 'var(--theme-secondary)' }}
        >
          {editMode ? (
            <EditableImage
              src={data.imageUrl}
              alt="About the baker"
              onImageChange={(url) => onContentChange({ imageUrl: url })}
              width={500}
              height={500}
              className="w-full h-full object-cover"
            />
          ) : data.imageUrl ? (
            <Image
              src={data.imageUrl}
              alt="About the baker"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: 'var(--theme-primary)' }}>
              No image set
            </div>
          )}
        </div>

        {/* Text */}
        <div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: headingColor }}>
            <EditableText
              value={data.headline}
              onChange={(val) => onContentChange({ headline: val })}
              variant="light"
            />
          </h2>
          <p className="leading-relaxed text-lg" style={{ color: textColor }}>
            <EditableText
              value={data.body}
              onChange={(val) => onContentChange({ body: val })}
              multiline
              variant="light"
            />
          </p>
        </div>
      </div>
    </section>
  );
}
