'use client';

import { useState, useRef, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import PaletteIcon from '@mui/icons-material/Palette';
import { useAdmin } from '@/lib/admin-context';
import { COLOR_SLOTS } from '@/lib/config/section-background';
import type { SectionStyle } from '@/lib/config/types';

const ROWS: { key: keyof SectionStyle; label: string }[] = [
  { key: 'background', label: 'Background' },
  { key: 'heading', label: 'Title / Subtitles' },
  { key: 'text', label: 'Paragraph Text' },
];

function isCustomValue(value: string): boolean {
  return value !== 'color1' && value !== 'color2' && value !== 'color3';
}

/** Small corner widget (edit mode only) that lets the admin restyle a single
 * section's background/heading/text colors without scrolling through a
 * sidebar list. Anchors to the section's own relative-positioned root. */
export default function SectionStyleEditor({
  sectionId,
  style,
}: {
  sectionId: string;
  style: SectionStyle;
}) {
  const { updateSectionStyle } = useAdmin();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={panelRef} className="absolute top-3 right-3 z-40" style={{ pointerEvents: 'auto' }}>
      <IconButton
        size="small"
        onClick={() => setOpen((o) => !o)}
        aria-label="Edit section colors"
        sx={{
          background: 'rgba(255,255,255,0.92)',
          boxShadow: 'var(--shadow-sm)',
          '&:hover': { background: 'white' },
        }}
      >
        <PaletteIcon sx={{ fontSize: 16 }} />
      </IconButton>

      {open && (
        <div
          className="absolute right-0 mt-2 p-3 rounded-[var(--radius-md)]"
          style={{
            background: 'white',
            width: 220,
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          {ROWS.map(({ key, label }) => {
            const current = style[key];
            return (
              <div key={key} className="mb-2.5 last:mb-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  {label}
                </p>
                <div className="flex items-center gap-1.5">
                  {COLOR_SLOTS.map(({ slot, label: slotLabel }) => (
                    <button
                      key={slot}
                      title={slotLabel}
                      onClick={() => updateSectionStyle(sectionId, { [key]: slot })}
                      className="w-5 h-5 rounded-full flex-shrink-0"
                      style={{
                        background:
                          slot === 'color1'
                            ? 'var(--theme-primary)'
                            : slot === 'color2'
                              ? 'var(--theme-secondary)'
                              : 'var(--theme-accent)',
                        border:
                          current === slot
                            ? '2px solid #1a1a1a'
                            : '1px solid rgba(0,0,0,0.15)',
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={isCustomValue(current) ? current : '#ffffff'}
                    onChange={(e) => updateSectionStyle(sectionId, { [key]: e.target.value })}
                    title="Custom color"
                    className="w-5 h-5 rounded-full cursor-pointer border-0 p-0 flex-shrink-0"
                    style={{
                      // Always keep a visible border — without one, a white/light
                      // custom value (or the unselected default swap) disappears
                      // against this panel's white background.
                      outline: isCustomValue(current)
                        ? '2px solid #1a1a1a'
                        : '1px solid rgba(0,0,0,0.15)',
                      outlineOffset: 1,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
