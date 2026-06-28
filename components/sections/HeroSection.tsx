'use client';

import Image from 'next/image';
import { useAdmin } from '@/lib/admin-context';
import EditableText from '@/components/admin/EditableText';
import EditableImage from '@/components/admin/EditableImage';
import SectionStyleEditor from '@/components/admin/SectionStyleEditor';
import type { HeroContent, SectionStyle } from '@/lib/config/types';
import { resolveStyleColor, DEFAULT_SECTION_STYLE } from '@/lib/config/section-background';

export default function HeroSection({
  data,
  sectionStyle,
}: {
  data: HeroContent;
  sectionStyle?: SectionStyle;
}) {
  const { editMode, updateHero } = useAdmin();
  const style = sectionStyle ?? DEFAULT_SECTION_STYLE;
  const headingColor = resolveStyleColor(style.heading, '#ffffff');
  const textColor = resolveStyleColor(style.text, 'var(--theme-secondary)');

  return (
    <section
      id="hero"
      className={`relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden ${editMode ? 'edit-mode-section-outline' : ''}`}
      style={{ backgroundColor: resolveStyleColor(style.background, 'var(--theme-accent)') }}
    >
      {editMode && <SectionStyleEditor sectionId="hero" style={style} />}
      {/* Background image or gradient */}
      {data.imageUrl ? (
        <Image
          src={data.imageUrl}
          alt="Hero background"
          fill
          priority
          className="object-cover opacity-60"
          sizes="100vw"
        />
      ) : (
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              'linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-primary) 100%)',
          }}
        />
      )}

      {/* Hero background image edit — full overlay, consistent with other editable images */}
      {editMode && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="absolute top-4 left-4 w-24 h-16 pointer-events-auto">
            <EditableImage
              src={data.imageUrl || ''}
              alt="Hero background"
              onImageChange={(url) => updateHero({ imageUrl: url })}
              width={300}
              height={180}
              className="w-full h-full object-cover rounded-lg border-2 border-white/60"
            />
            <span className="absolute -bottom-5 left-0 text-white/70 text-[10px] whitespace-nowrap">
              Background image
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ color: headingColor }}>
          <EditableText
            value={data.headline}
            onChange={(val) => updateHero({ headline: val })}
            variant="dark"
          />
        </h1>

        <p className="text-xl md:text-2xl mb-8" style={{ color: textColor }}>
          <EditableText
            value={data.subtext}
            onChange={(val) => updateHero({ subtext: val })}
            multiline
            variant="dark"
          />
        </p>

        <a
          href="#how-to-order"
          onClick={(e) => {
            if (editMode) e.preventDefault();
          }}
          className="inline-block font-semibold px-8 py-4 rounded-full transition-colors duration-200 text-lg text-white hover:opacity-90"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        >
          <EditableText
            value={data.ctaText}
            onChange={(val) => updateHero({ ctaText: val })}
            variant="dark"
            className="text-white"
          />
        </a>
      </div>
    </section>
  );
}
