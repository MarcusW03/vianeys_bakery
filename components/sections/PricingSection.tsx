'use client';

import { useAdmin } from '@/lib/admin-context';
import EditableText from '@/components/admin/EditableText';
import SectionStyleEditor from '@/components/admin/SectionStyleEditor';
import type { PricingItem, SectionStyle } from '@/lib/config/types';
import { resolveStyleColor, DEFAULT_SECTION_STYLE } from '@/lib/config/section-background';

interface PricingSectionProps {
  headline: string;
  items: PricingItem[];
  sectionStyle?: SectionStyle;
}

export default function PricingSection({ headline, items, sectionStyle }: PricingSectionProps) {
  const { editMode, updatePricing, addPricingItem, removePricingItem } = useAdmin();
  const style = sectionStyle ?? DEFAULT_SECTION_STYLE;
  const headingColor = resolveStyleColor(style.heading, 'var(--theme-accent)');
  const textColor = resolveStyleColor(style.text, '#4b5563');

  return (
    <section
      id="pricing"
      className={`py-20 px-6 ${editMode ? 'edit-mode-section-outline' : ''}`}
      style={{ backgroundColor: resolveStyleColor(style.background, 'var(--theme-secondary)') }}
    >
      {editMode && <SectionStyleEditor sectionId="pricing" style={style} />}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: headingColor }}>
          <EditableText
            value={headline}
            onChange={(val) => updatePricing({ headline: val })}
            variant="light"
          />
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="relative bg-white rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow group"
              style={{ border: '1px solid color-mix(in srgb, var(--theme-secondary) 80%, transparent)' }}
            >
              {editMode && (
                <button
                  onClick={() => removePricingItem(item.id)}
                  className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  ×
                </button>
              )}

              <h3 className="text-xl font-semibold mb-2" style={{ color: headingColor }}>
                <EditableText
                  value={item.name}
                  onChange={(val) =>
                    updatePricing({
                      items: items.map((it, j) => (j === i ? { ...it, name: val } : it)),
                    })
                  }
                  variant="light"
                />
              </h3>

              <p className="mb-4 text-sm leading-relaxed" style={{ color: textColor }}>
                <EditableText
                  value={item.description}
                  onChange={(val) =>
                    updatePricing({
                      items: items.map((it, j) =>
                        j === i ? { ...it, description: val } : it,
                      ),
                    })
                  }
                  multiline
                  variant="light"
                />
              </p>

              <span
                className="inline-block font-semibold px-4 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--theme-secondary) 70%, white)',
                  color: 'var(--theme-primary)',
                }}
              >
                <EditableText
                  value={item.priceRange}
                  onChange={(val) =>
                    updatePricing({
                      items: items.map((it, j) =>
                        j === i ? { ...it, priceRange: val } : it,
                      ),
                    })
                  }
                  variant="light"
                />
              </span>
            </div>
          ))}

          {editMode && (
            <button
              onClick={addPricingItem}
              className="bg-white rounded-[var(--radius-lg)] p-6 border-2 border-dashed flex items-center justify-center text-3xl hover:opacity-70 transition-opacity min-h-[160px]"
              style={{
                borderColor: 'var(--theme-primary)',
                color: 'var(--theme-primary)',
              }}
            >
              +
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
