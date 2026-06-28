'use client';

import EditableText from '@/components/admin/EditableText';
import SectionStyleEditor from '@/components/admin/SectionStyleEditor';
import type { HowToOrderContent } from '@/lib/config/types';
import { resolveStyleColor } from '@/lib/config/section-background';
import type { SectionRendererProps } from '@/lib/sections/registry';

export default function HowToOrderSection({
  instance,
  editMode,
  onContentChange,
}: SectionRendererProps<HowToOrderContent>) {
  const { headline, steps } = instance.content;
  const style = instance.style;
  const headingColor = resolveStyleColor(style.heading, 'var(--theme-accent)');
  const textColor = resolveStyleColor(style.text, '#4b5563');

  return (
    <section
      id="how-to-order"
      className={`py-20 px-6 ${editMode ? 'edit-mode-section-outline' : ''}`}
      style={{ backgroundColor: resolveStyleColor(style.background, 'var(--theme-secondary)') }}
    >
      {editMode && <SectionStyleEditor instanceId={instance.id} style={style} />}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: headingColor }}>
          <EditableText
            value={headline}
            onChange={(val) => onContentChange({ headline: val })}
            variant="light"
          />
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {steps.map((step, i) => (
            <div key={step.id} className="flex gap-4">
              {/* Step number badge */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                {step.stepNumber}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1" style={{ color: headingColor }}>
                  <EditableText
                    value={step.title}
                    onChange={(val) =>
                      onContentChange({
                        steps: steps.map((s, j) => (j === i ? { ...s, title: val } : s)),
                      })
                    }
                    variant="light"
                  />
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: textColor }}>
                  <EditableText
                    value={step.description}
                    onChange={(val) =>
                      onContentChange({
                        steps: steps.map((s, j) =>
                          j === i ? { ...s, description: val } : s,
                        ),
                      })
                    }
                    multiline
                    variant="light"
                  />
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
