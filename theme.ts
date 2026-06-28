import { createTheme, type Theme } from '@mui/material/styles';
import type { SiteTheme } from '@/lib/config/types';

export const DEFAULT_THEME_COLORS: SiteTheme = {
  primaryColor: '#b5804e',
  secondaryColor: '#f5e6d3',
  accentColor: '#3a2a1a',
};

/** Builds a MUI theme from the admin-editable brand colors so MUI components
 * (Tabs, Buttons, etc. using color="primary") follow the same palette as the
 * CSS-variable-driven custom UI, instead of a hardcoded palette. */
export function createAppTheme(colors: SiteTheme): Theme {
  return createTheme({
    cssVariables: true,
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
    },
    palette: {
      primary: {
        main: colors.primaryColor,
      },
      secondary: {
        main: colors.secondaryColor,
      },
      background: {
        default: '#fffdf9',
      },
      text: {
        primary: colors.accentColor,
      },
    },
  });
}
