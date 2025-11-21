import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 12/13/14 as reference: 390x844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Scaling function for responsive sizing
const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export const COLORS = {
  // Primary colors
  primary: '#1E3A8A', // Dark blue
  primaryLight: '#3B82F6', // Lighter blue
  primaryDark: '#1E40AF', // Darker blue
  
  // Secondary colors
  secondary: '#10B981', // Green
  secondaryLight: '#34D399', // Light green
  accent: '#F59E0B', // Orange
  accentLight: '#FBBF24', // Light orange
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#6B7280',
  grayLight: '#F3F4F6',
  grayDark: '#374151',
  
  // Status colors
  success: '#10B981', // Green
  warning: '#F59E0B', // Orange
  error: '#EF4444', // Red
  info: '#3B82F6', // Blue
  
  // Background colors
  background: '#F8FAFC',
  card: '#FFFFFF',
  header: '#1E3A8A',
};

export const FONTS = {
  // Font sizes (responsive)
  xs: moderateScale(12),
  sm: moderateScale(14),
  base: moderateScale(16),
  lg: moderateScale(18),
  xl: moderateScale(20),
  '2xl': moderateScale(24),
  '3xl': moderateScale(30),
  '4xl': moderateScale(36),
  
  // Font weights
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const SPACING = {
  xs: scale(4),
  sm: scale(8),
  base: scale(16),
  lg: scale(24),
  xl: scale(32),
  '2xl': scale(48),
  '3xl': scale(64),
};

export const BORDER_RADIUS = {
  sm: scale(8),
  base: scale(12),
  lg: scale(16),
  xl: scale(20),
  '2xl': scale(24),
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Screen dimensions for responsive layouts
export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < 375,
  isMedium: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLarge: SCREEN_WIDTH >= 414,
};

// Helper functions
export const wp = (percentage: number) => (SCREEN_WIDTH * percentage) / 100;
export const hp = (percentage: number) => (SCREEN_HEIGHT * percentage) / 100;
