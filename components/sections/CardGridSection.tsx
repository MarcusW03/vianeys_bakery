'use client';

import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditableText from '@/components/admin/EditableText';
import SectionStyleEditor from '@/components/admin/SectionStyleEditor';
import AddTileCard from '@/components/sections/shared/AddTileCard';
import RemoveIconButton from '@/components/sections/shared/RemoveIconButton';
import type { CardGridItem, CardGridContent } from '@/lib/config/types';
import { resolveStyleColor, resolveStyleRadius, resolveBackgroundLayer } from '@/lib/config/section-background';
import { getSectionAnchorId } from '@/lib/sections/registry';
import type { SectionRendererProps } from '@/lib/sections/registry';

export default function CardGridSection({
  instance,
  editMode,
  onContentChange,
  allSections,
}: SectionRendererProps<CardGridContent>) {
  const { headline, items } = instance.content;
  const style = instance.style;
  const headingColor = resolveStyleColor(style.heading, 'var(--theme-accent)');
  const textColor = resolveStyleColor(style.text, '#4b5563');

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const addItem = () => {
    const newItem: CardGridItem = {
      id: `item-${Date.now()}`,
      title: 'New Item',
      description: 'Add a description',
      badgeText: 'Price TBD',
    };
    onContentChange({ items: [...items, newItem] });
  };

  const removeItem = (id: string) => {
    onContentChange({ items: items.filter((it) => it.id !== id) });
  };

  // ── Drag-to-reorder (insert, not swap) — same pattern as Sidebar.tsx's ──
  // section nav and ManageSectionsDialog's section list.
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(targetId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const newOrder = items.map((it) => it.id);
    const fromIdx = newOrder.indexOf(draggedId);
    const toIdx = newOrder.indexOf(targetId);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedId);
    onContentChange({ items: newOrder.map((id) => items.find((it) => it.id === id)!) });
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <section
      id={getSectionAnchorId(instance, allSections)}
      className={`py-20 px-6 overflow-hidden shadow-[var(--shadow-md)] ${editMode ? 'edit-mode-section-outline' : ''}`}
      style={{
        ...resolveBackgroundLayer(style, 'var(--theme-secondary)'),
        borderRadius: resolveStyleRadius(style.borderRadius, 'var(--radius-md)'),
      }}
    >
      {editMode && <SectionStyleEditor instanceId={instance.id} style={style} />}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 tracking-tight" style={{ color: headingColor }}>
          <EditableText
            value={headline}
            onChange={(val) => onContentChange({ headline: val })}
            variant="light"
          />
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {items.map((item, i) => {
            const isDragging = draggedId === item.id;
            const isOver = dragOverId === item.id && !isDragging;
            return (
            <Card
              key={item.id}
              variant="outlined"
              className="group"
              draggable={editMode}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderColor: isOver
                  ? 'var(--theme-primary)'
                  : 'color-mix(in srgb, var(--theme-secondary) 80%, transparent)',
                opacity: isDragging ? 0.4 : 1,
                cursor: editMode ? 'grab' : undefined,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.1s ease',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: 'var(--shadow-md)' },
              }}
            >
              {editMode && (
                <DragIndicatorIcon
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 1,
                    fontSize: 18,
                    color: 'var(--theme-accent)',
                    opacity: 0,
                    pointerEvents: 'none',
                    '.group:hover &': { opacity: 0.4 },
                  }}
                />
              )}
              {editMode && <RemoveIconButton onClick={() => removeItem(item.id)} ariaLabel="Remove item" />}

              <CardContent sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 className="text-xl font-semibold mb-2" style={{ color: headingColor }}>
                  <EditableText
                    value={item.title}
                    onChange={(val) =>
                      onContentChange({
                        items: items.map((it, j) => (j === i ? { ...it, title: val } : it)),
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

                {/* mt-auto pins the badge to the card's bottom edge regardless
                    of how long the description above it runs, so badges line
                    up across a row instead of trailing the longest card. */}
                <span
                  className="inline-block font-semibold px-4 py-1 rounded-full text-sm self-start"
                  style={{
                    marginTop: 'auto',
                    backgroundColor: 'color-mix(in srgb, var(--theme-secondary) 70%, white)',
                    color: 'var(--theme-primary)',
                  }}
                >
                  <EditableText
                    value={item.badgeText}
                    onChange={(val) =>
                      onContentChange({
                        items: items.map((it, j) =>
                          j === i ? { ...it, badgeText: val } : it,
                        ),
                      })
                    }
                    variant="light"
                  />
                </span>
              </CardContent>
            </Card>
            );
          })}

          {editMode && (
            <AddTileCard onClick={addItem} ariaLabel="Add item" sx={{ minHeight: 160 }} />
          )}
        </div>
      </div>
    </section>
  );
}
