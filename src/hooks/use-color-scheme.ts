import { useThemeContext } from '@/context/theme-context';

export function useColorScheme() {
  const { activeScheme } = useThemeContext();
  return activeScheme;
}
