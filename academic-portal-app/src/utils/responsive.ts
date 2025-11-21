import { Dimensions, Platform, PixelRatio } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768;
export const isTablet = SCREEN_WIDTH >= 768;
export const isLargeTablet = SCREEN_WIDTH >= 1024;

// Responsive width based on percentage
export const wp = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

// Responsive height based on percentage
export const hp = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Responsive font size
export const rf = (size: number): number => {
  const scale = SCREEN_WIDTH / 375; // Base width (iPhone X)
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

// Responsive spacing
export const rs = (size: number): number => {
  return (SCREEN_WIDTH / 375) * size;
};

// Get number of columns for grid based on device width
export const getGridColumns = (): number => {
  if (isLargeTablet) return 4;
  if (isTablet) return 3;
  if (isSmallDevice) return 1;
  return 2;
};

// Safe area padding for notched devices
export const getStatusBarHeight = (): number => {
  if (Platform.OS === 'ios') {
    // iPhone X and newer
    if (SCREEN_HEIGHT >= 812) return 44;
    return 20;
  }
  const version = typeof Platform.Version === 'number' ? Platform.Version : 0;
  return version > 20 ? 24 : 0;
};

// Bottom safe area for devices with gesture bar
export const getBottomSpace = (): number => {
  if (Platform.OS === 'ios' && SCREEN_HEIGHT >= 812) {
    return 34;
  }
  return 0;
};

// Responsive card width for lists
export const getCardWidth = (): number => {
  if (isTablet) {
    return (SCREEN_WIDTH - 60) / 2; // 2 columns on tablet
  }
  return SCREEN_WIDTH - 32; // Full width with margins on phone
};

// Adaptive font sizes based on device
export const adaptiveFontSize = {
  tiny: rf(10),
  small: rf(12),
  base: rf(14),
  medium: rf(16),
  large: rf(18),
  xlarge: rf(20),
  xxlarge: rf(24),
  heading: rf(28),
  title: rf(32),
};

// Adaptive spacing based on device
export const adaptiveSpacing = {
  xs: rs(4),
  sm: rs(8),
  base: rs(12),
  md: rs(16),
  lg: rs(20),
  xl: rs(24),
  xxl: rs(32),
};

// Get orientation
export const isPortrait = (): boolean => {
  return SCREEN_HEIGHT > SCREEN_WIDTH;
};

export const isLandscape = (): boolean => {
  return SCREEN_WIDTH > SCREEN_HEIGHT;
};

// Dimensions listener for dynamic updates
export const useDimensions = () => {
  return Dimensions.get('window');
};
