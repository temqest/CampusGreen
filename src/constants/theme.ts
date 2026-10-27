/**
 * CampusGreen Connect Design System
 * Tailored for Filipino college students with warm university tones,
 * deep forest academic green, and crisp, legible cards.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // CampusGreen Brand
    primary: '#1F5C3A',
    primaryDark: '#18482D',
    primaryLight: '#E6EFE9',
    primaryBorder: '#1F5C3A',

    // Canvas & Surfaces
    background: '#FAFAF7',
    surface: '#FFFFFF',
    surfaceSubtle: '#F6F6F2',
    border: '#E8E8E3',
    borderSubtle: '#F0F0EB',

    // Text hierarchy
    text: '#1A1A1A',
    textSecondary: '#6B6B6B',
    textMuted: '#9CA3AF',
    textWhite: '#FFFFFF',

    // Badges & Accents
    badgeBg: '#F6F6F2',
    badgeGreenBg: '#E6EFE9',
    badgeGreenText: '#1F5C3A',
    gold: '#D97706',
    goldBg: '#FEF3C7',
    blue: '#2563EB',
    blueBg: '#EFF6FF',
    error: '#DC2626',
    errorBg: '#FEE2E2',

    // Deprecated template compatibility
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6EFE9',
  },
  dark: {
    primary: '#2D8252',
    primaryDark: '#1F5C3A',
    primaryLight: '#183824',
    primaryBorder: '#2D8252',

    background: '#121210',
    surface: '#1E1E1C',
    surfaceSubtle: '#262624',
    border: '#333330',
    borderSubtle: '#2A2A28',

    text: '#F5F5F3',
    textSecondary: '#A3A3A0',
    textMuted: '#71716E',
    textWhite: '#FFFFFF',

    badgeBg: '#262624',
    badgeGreenBg: '#183824',
    badgeGreenText: '#4ADE80',
    gold: '#FBBF24',
    goldBg: '#451A03',
    blue: '#60A5FA',
    blueBg: '#172554',
    error: '#F87171',
    errorBg: '#450A0A',

    backgroundElement: '#1E1E1C',
    backgroundSelected: '#183824',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'Public Sans',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Public Sans, -apple-system, Roboto, sans-serif',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 40,
  eight: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 24, android: 16, web: 0 }) ?? 0;
export const MaxContentWidth = 640;
