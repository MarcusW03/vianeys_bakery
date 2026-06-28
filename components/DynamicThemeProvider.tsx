'use client';

import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme, DEFAULT_THEME_COLORS } from '@/theme';
import type { SiteTheme } from '@/lib/config/types';

interface ThemeColorsContextValue {
  setThemeColors: (colors: SiteTheme) => void;
}

const ThemeColorsContext = createContext<ThemeColorsContextValue | null>(null);

/** Lets any client component (PageSections, on config load/change) push the
 * site's brand colors into the MUI theme, so MUI components stay in sync
 * with the admin's color picker the same way the --theme-* CSS vars do. */
export function useThemeColors(): ThemeColorsContextValue {
  const ctx = useContext(ThemeColorsContext);
  if (!ctx) throw new Error('useThemeColors must be used inside DynamicThemeProvider');
  return ctx;
}

export default function DynamicThemeProvider({
  children,
  initialColors,
}: {
  children: React.ReactNode;
  /** Server-resolved colors from the saved config, so the MUI theme matches
   * on first render instead of starting at hardcoded defaults and flashing
   * to the real colors after mount. */
  initialColors?: SiteTheme;
}) {
  const [colors, setColors] = useState<SiteTheme>(initialColors ?? DEFAULT_THEME_COLORS);

  const setThemeColors = useCallback((next: SiteTheme) => {
    setColors((prev) =>
      prev.primaryColor === next.primaryColor &&
      prev.secondaryColor === next.secondaryColor &&
      prev.accentColor === next.accentColor
        ? prev
        : next,
    );
  }, []);

  const theme = useMemo(() => createAppTheme(colors), [colors]);

  return (
    <ThemeColorsContext.Provider value={{ setThemeColors }}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemeColorsContext.Provider>
  );
}
