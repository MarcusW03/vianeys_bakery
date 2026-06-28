import type { ColorSlot, SectionStyle } from './types';

export const COLOR_SLOTS: { slot: ColorSlot; label: string }[] = [
  { slot: 'color1', label: 'Color 1' },
  { slot: 'color2', label: 'Color 2' },
  { slot: 'color3', label: 'Color 3' },
];

const SLOT_TO_CSS_VAR: Record<ColorSlot, string> = {
  color1: 'var(--theme-primary)',
  color2: 'var(--theme-secondary)',
  color3: 'var(--theme-accent)',
};

function isColorSlot(value: string): value is ColorSlot {
  return value === 'color1' || value === 'color2' || value === 'color3';
}

/** Resolves a SectionStyle field (a color slot reference or a literal hex) to
 * a usable CSS color value, falling back to `fallback` if unset. */
export function resolveStyleColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  return isColorSlot(value) ? SLOT_TO_CSS_VAR[value] : value;
}

export const DEFAULT_SECTION_STYLE: SectionStyle = {
  background: '#ffffff',
  heading: 'color3',
  text: 'color3',
};
