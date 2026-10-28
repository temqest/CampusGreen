import React, { createContext, useContext, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';
export type AppTheme = (typeof Colors)['light' | 'dark'];

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  activeScheme: 'light' | 'dark';
  theme: AppTheme;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  setThemeMode: () => {},
  activeScheme: 'light',
  theme: Colors.light,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('campusgreen_theme_mode');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    }
    return 'system';
  });

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('campusgreen_theme_mode', mode);
    }
  };

  const activeScheme: 'light' | 'dark' =
    themeMode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : themeMode;

  const theme = Colors[activeScheme];

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, activeScheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
