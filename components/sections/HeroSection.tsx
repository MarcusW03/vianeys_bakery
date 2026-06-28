'use client';

import Image from 'next/image';
import Button from '@mui/material/Button';
import EditableText from '@/components/admin/EditableText';
import EditableImage from '@/components/admin/EditableImage';
import SectionStyleEditor from '@/components/admin/SectionStyleEditor';
import type { HeroContent } from '@/lib/config/types';
import { resolveStyleColor } from '@/lib/config/section-background';
import type { SectionRendererProps } from '@/lib/sections/registry';

export default function HeroSection({
  instance,
  editMode,
  onContentChange,
}: SectionRendererProps<HeroContent>) {
  const data = instance.content;
  const style = instance.style;
  const headingColor = resolveStyleColor(style.heading, '#ffffff');
  const textColor = resolveStyleColor(style.text, 'var(--theme-secondary)');

  return (
    <section
      id="hero"
      className={`relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden ${editMode ? 'edit-mode-section-outline' : ''}`}
      style={{ backgroundColor: resolveStyleColor(style.background, 'var(--theme-accent)') }}
    >
      {editMode && <SectionStyleEditor instanceId={instance.id} style={style} />}
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
              onImageChange={(url) => onContentChange({ imageUrl: url })}
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
            onChange={(val) => onContentChange({ headline: val })}
            variant="dark"
          />
        </h1>

        <p className="text-xl md:text-2xl mb-8" style={{ color: textColor }}>
          <EditableText
            value={data.subtext}
            onChange={(val) => onContentChange({ subtext: val })}
            multiline
            variant="dark"
          />
        </p>

        <Button
          href="#how-to-order"
          onClick={(e) => {
            if (editMode) e.preventDefault();
          }}
          variant="contained"
          size="large"
          sx={{
            borderRadius: 999,
            px: 4,
            py: 2,
            fontSize: 18,
            fontWeight: 600,
            textTransform: 'none',
            bgcolor: 'var(--theme-primary)',
            '&:hover': { bgcolor: 'var(--theme-primary)', opacity: 0.9 },
          }}
        >
          <EditableText
            value={data.ctaText}
            onChange={(val) => onContentChange({ ctaText: val })}
            variant="dark"
            className="text-white"
          />
        </Button>
      </div>
    </section>
  );
}
