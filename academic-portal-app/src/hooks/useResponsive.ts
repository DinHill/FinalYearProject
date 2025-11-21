import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;

  return {
    width,
    height,
    isSmallDevice: width < 375,
    isMediumDevice: width >= 375 && width < 768,
    isTablet: width >= 768,
    isLargeTablet: width >= 1024,
    isPortrait: height > width,
    isLandscape: width > height,
    
    // Responsive helpers
    wp: (percentage: number) => (width * percentage) / 100,
    hp: (percentage: number) => (height * percentage) / 100,
    
    // Grid columns based on device
    gridColumns: width >= 1024 ? 4 : width >= 768 ? 3 : width < 375 ? 1 : 2,
  };
};
