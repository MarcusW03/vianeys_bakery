import type { ColorSlot, RadiusSlot, SectionStyle } from './types';

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

export const RADIUS_SLOTS: { slot: RadiusSlot; label: string }[] = [
  { slot: 'radius-sm', label: 'Sm' },
  { slot: 'radius-md', label: 'Md' },
  { slot: 'radius-lg', label: 'Lg' },
];

const RADIUS_SLOT_TO_CSS_VAR: Record<RadiusSlot, string> = {
  'radius-sm': 'var(--radius-sm)',
  'radius-md': 'var(--radius-md)',
  'radius-lg': 'var(--radius-lg)',
};

function isRadiusSlot(value: string): value is RadiusSlot {
  return value === 'radius-sm' || value === 'radius-md' || value === 'radius-lg';
}

/** Resolves a SectionStyle.borderRadius value (a radius slot or a literal CSS
 * value) the same way resolveStyleColor resolves colors. */
export function resolveStyleRadius(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  return isRadiusSlot(value) ? RADIUS_SLOT_TO_CSS_VAR[value] : value;
}

/** The section root's full background layer: an image (cover, centered) when
 * the admin picked one, otherwise the existing color resolution. */
export function resolveBackgroundLayer(
  style: SectionStyle,
  fallbackColor: string,
): { backgroundColor?: string; backgroundImage?: string; backgroundSize?: string; backgroundPosition?: string } {
  if (style.backgroundImageUrl) {
    return {
      backgroundImage: `url(${style.backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { backgroundColor: resolveStyleColor(style.background, fallbackColor) };
}

export const DEFAULT_SECTION_STYLE: SectionStyle = {
  background: '#ffffff',
  heading: 'color3',
  text: 'color3',
};
