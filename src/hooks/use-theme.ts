/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useThemeContext } from '@/context/theme-context';

export function useTheme() {
  const { theme } = useThemeContext();
  return theme;
}
