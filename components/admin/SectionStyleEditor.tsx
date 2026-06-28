'use client';

import { useState, useRef, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import PaletteIcon from '@mui/icons-material/Palette';
import CloseIcon from '@mui/icons-material/Close';
import { useAdmin } from '@/lib/admin-context';
import { COLOR_SLOTS, RADIUS_SLOTS } from '@/lib/config/section-background';
import type { SectionStyle } from '@/lib/config/types';
import ImagePicker from './ImagePicker';

type ColorStyleKey = 'background' | 'heading' | 'text';

const ROWS: { key: ColorStyleKey; label: string }[] = [
  { key: 'background', label: 'Background' },
  { key: 'heading', label: 'Title / Subtitles' },
  { key: 'text', label: 'Paragraph Text' },
];

function isCustomValue(value: string): boolean {
  return value !== 'color1' && value !== 'color2' && value !== 'color3';
}

/** Small corner widget (edit mode only) that lets the admin restyle a single
 * section's background/heading/text colors, corner radius, and background
 * image without scrolling through a sidebar list. Anchors to the section's
 * own relative-positioned root. */
export default function SectionStyleEditor({
  instanceId,
  style,
}: {
  instanceId: string;
  style: SectionStyle;
}) {
  const { updateSectionStyle } = useAdmin();
  const [open, setOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
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

  const currentRadius = style.borderRadius ?? 'radius-md';

  return (
    <div ref={panelRef} className="absolute top-3 right-3 z-40" style={{ pointerEvents: 'auto' }}>
      <IconButton
        size="small"
        onClick={() => setOpen((o) => !o)}
        aria-label="Edit section style"
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
                      onClick={() => updateSectionStyle(instanceId, { [key]: slot })}
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
                    onChange={(e) => updateSectionStyle(instanceId, { [key]: e.target.value })}
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

          {/* ── Corner Radius ── */}
          <div className="mb-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Corner Radius
            </p>
            <div className="flex items-center gap-1.5">
              {RADIUS_SLOTS.map(({ slot, label }) => (
                <button
                  key={slot}
                  title={label}
                  onClick={() => updateSectionStyle(instanceId, { borderRadius: slot })}
                  className="flex-1 h-6 text-[10px] font-semibold"
                  style={{
                    borderRadius:
                      slot === 'radius-sm' ? 'var(--radius-sm)' : slot === 'radius-md' ? 'var(--radius-md)' : 'var(--radius-lg)',
                    background: currentRadius === slot ? '#1a1a1a' : 'rgba(0,0,0,0.06)',
                    color: currentRadius === slot ? 'white' : '#1a1a1a',
                    border: 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Background Image ── */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Background Image
            </p>
            {style.backgroundImageUrl ? (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-9 h-9 rounded-[var(--radius-sm)] flex-shrink-0 bg-cover bg-center border"
                  style={{
                    backgroundImage: `url(${style.backgroundImageUrl})`,
                    borderColor: 'rgba(0,0,0,0.15)',
                  }}
                />
                <Button size="small" onClick={() => setImagePickerOpen(true)}>
                  Change
                </Button>
                <IconButton
                  size="small"
                  aria-label="Remove background image"
                  onClick={() => updateSectionStyle(instanceId, { backgroundImageUrl: undefined })}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </div>
            ) : (
              <Button size="small" variant="outlined" onClick={() => setImagePickerOpen(true)}>
                Choose Image
              </Button>
            )}
          </div>
        </div>
      )}

      <ImagePicker
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelect={(url) => {
          updateSectionStyle(instanceId, { backgroundImageUrl: url });
          setImagePickerOpen(false);
        }}
        mode="pick"
      />
    </div>
  );
}
