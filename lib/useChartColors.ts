import { useMemo } from 'react';

import { useColorScheme } from 'nativewind';

export type ChartColors = {
  primary: string;
  primaryForeground: string;
  primaryAlpha: string;
  primaryDark: string;
  secondary: string;
  text: string;
  textMuted: string;
  background: string;
  card: string;
  grid: string;
};

export function useChartColors(): ChartColors {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return useMemo(
    () => ({
      primary: isDark ? '#A3E635' : '#84CC16',
      primaryForeground: isDark ? '#0A0A0A' : '#0F0F0F',
      primaryAlpha: isDark ? '#A3E63555' : '#84CC1655',
      primaryDark: isDark ? '#84CC16' : '#65A30D',
      secondary: isDark ? '#2DD4BF' : '#14B8A6',
      text: isDark ? '#FAFAFA' : '#0F0F0F',
      textMuted: isDark ? '#94A3B8' : '#64748B',
      background: isDark ? '#161616' : '#FFFFFF',
      card: isDark ? '#262626' : '#F1F5F9',
      grid: isDark ? '#262626' : '#E2E8F0',
    }),
    [isDark]
  );
}
