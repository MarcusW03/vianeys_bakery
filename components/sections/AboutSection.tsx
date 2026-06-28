'use client';

import Image from 'next/image';
import { useAdmin } from '@/lib/admin-context';
import EditableText from '@/components/admin/EditableText';
import EditableImage from '@/components/admin/EditableImage';
import SectionStyleEditor from '@/components/admin/SectionStyleEditor';
import type { AboutContent, SectionStyle } from '@/lib/config/types';
import { resolveStyleColor, DEFAULT_SECTION_STYLE } from '@/lib/config/section-background';

export default function AboutSection({
  data,
  sectionStyle,
}: {
  data: AboutContent;
  sectionStyle?: SectionStyle;
}) {
  const { editMode, updateAbout } = useAdmin();
  const style = sectionStyle ?? DEFAULT_SECTION_STYLE;
  const headingColor = resolveStyleColor(style.heading, 'var(--theme-accent)');
  const textColor = resolveStyleColor(style.text, '#4b5563');

  return (
    <section
      id="about"
      className={`py-20 px-6 ${editMode ? 'edit-mode-section-outline' : ''}`}
      style={{ backgroundColor: resolveStyleColor(style.background, '#ffffff') }}
    >
      {editMode && <SectionStyleEditor sectionId="about" style={style} />}
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
              onImageChange={(url) => updateAbout({ imageUrl: url })}
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
              onChange={(val) => updateAbout({ headline: val })}
              variant="light"
            />
          </h2>
          <p className="leading-relaxed text-lg" style={{ color: textColor }}>
            <EditableText
              value={data.body}
              onChange={(val) => updateAbout({ body: val })}
              multiline
              variant="light"
            />
          </p>
        </div>
      </div>
    </section>
  );
}
