'use client';

import EditableText from '@/components/admin/EditableText';
import SectionStyleEditor from '@/components/admin/SectionStyleEditor';
import AddTileCard from '@/components/sections/shared/AddTileCard';
import RemoveIconButton from '@/components/sections/shared/RemoveIconButton';
import type { NumberedListContent, NumberedListItem } from '@/lib/config/types';
import { resolveStyleColor } from '@/lib/config/section-background';
import { getSectionAnchorId } from '@/lib/sections/registry';
import type { SectionRendererProps } from '@/lib/sections/registry';

export default function NumberedListSection({
  instance,
  editMode,
  onContentChange,
  allSections,
}: SectionRendererProps<NumberedListContent>) {
  const { headline, steps } = instance.content;
  const style = instance.style;
  const headingColor = resolveStyleColor(style.heading, 'var(--theme-accent)');
  const textColor = resolveStyleColor(style.text, '#4b5563');

  const addStep = () => {
    const newStep: NumberedListItem = {
      id: `step-${Date.now()}`,
      stepNumber: steps.length + 1,
      title: 'New Step',
      description: 'Add a description',
    };
    onContentChange({ steps: [...steps, newStep] });
  };

  // Re-numbers the remaining steps so they stay sequential (1, 2, 3...)
  // instead of leaving a gap where the removed step used to be.
  const removeStep = (id: string) => {
    const renumbered = steps
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    onContentChange({ steps: renumbered });
  };

  return (
    <section
      id={getSectionAnchorId(instance, allSections)}
      className={`py-20 px-6 rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-md)] ${editMode ? 'edit-mode-section-outline' : ''}`}
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
            <div key={step.id} className="relative flex gap-4 group">
              {editMode && <RemoveIconButton onClick={() => removeStep(step.id)} ariaLabel="Remove step" />}
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

          {editMode && (
            <AddTileCard onClick={addStep} ariaLabel="Add step" sx={{ minHeight: 80 }} />
          )}
        </div>
      </div>
    </section>
  );
}
