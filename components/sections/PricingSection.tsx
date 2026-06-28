'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditableText from '@/components/admin/EditableText';
import SectionStyleEditor from '@/components/admin/SectionStyleEditor';
import type { PricingItem, PricingContent } from '@/lib/config/types';
import { resolveStyleColor } from '@/lib/config/section-background';
import type { SectionRendererProps } from '@/lib/sections/registry';

export default function PricingSection({
  instance,
  editMode,
  onContentChange,
}: SectionRendererProps<PricingContent>) {
  const { headline, items } = instance.content;
  const style = instance.style;
  const headingColor = resolveStyleColor(style.heading, 'var(--theme-accent)');
  const textColor = resolveStyleColor(style.text, '#4b5563');

  const addItem = () => {
    const newItem: PricingItem = {
      id: `item-${Date.now()}`,
      name: 'New Item',
      description: 'Add a description',
      priceRange: 'Price TBD',
    };
    onContentChange({ items: [...items, newItem] });
  };

  const removeItem = (id: string) => {
    onContentChange({ items: items.filter((it) => it.id !== id) });
  };

  return (
    <section
      id="pricing"
      className={`py-20 px-6 ${editMode ? 'edit-mode-section-outline' : ''}`}
      style={{ backgroundColor: resolveStyleColor(style.background, 'var(--theme-secondary)') }}
    >
      {editMode && <SectionStyleEditor instanceId={instance.id} style={style} />}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: headingColor }}>
          <EditableText
            value={headline}
            onChange={(val) => onContentChange({ headline: val })}
            variant="light"
          />
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {items.map((item, i) => (
            <Card
              key={item.id}
              variant="outlined"
              sx={{
                position: 'relative',
                borderColor: 'color-mix(in srgb, var(--theme-secondary) 80%, transparent)',
                '&:hover': { boxShadow: 2 },
              }}
            >
              {editMode && (
                <IconButton
                  size="small"
                  onClick={() => removeItem(item.id)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    bgcolor: 'error.main',
                    color: 'white',
                    width: 20,
                    height: 20,
                    opacity: 0,
                    '.MuiCard-root:hover &': { opacity: 1 },
                    '&:hover': { bgcolor: 'error.dark' },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}

              <CardContent>
                <h3 className="text-xl font-semibold mb-2" style={{ color: headingColor }}>
                  <EditableText
                    value={item.name}
                    onChange={(val) =>
                      onContentChange({
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
                      onContentChange({
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
                      onContentChange({
                        items: items.map((it, j) =>
                          j === i ? { ...it, priceRange: val } : it,
                        ),
                      })
                    }
                    variant="light"
                  />
                </span>
              </CardContent>
            </Card>
          ))}

          {editMode && (
            <Card
              variant="outlined"
              onClick={addItem}
              sx={{
                cursor: 'pointer',
                minHeight: 160,
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
              <AddIcon sx={{ fontSize: 32 }} />
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
