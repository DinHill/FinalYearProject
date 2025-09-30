import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONTS, BORDER_RADIUS, SPACING } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'base' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'base',
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BORDER_RADIUS.base,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.6 : 1,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: COLORS.primary,
          paddingVertical: size === 'sm' ? SPACING.sm : size === 'lg' ? SPACING.lg : SPACING.base,
          paddingHorizontal: size === 'sm' ? SPACING.base : size === 'lg' ? SPACING.xl : SPACING.lg,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: COLORS.secondary,
          paddingVertical: size === 'sm' ? SPACING.sm : size === 'lg' ? SPACING.lg : SPACING.base,
          paddingHorizontal: size === 'sm' ? SPACING.base : size === 'lg' ? SPACING.xl : SPACING.lg,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: COLORS.primary,
          paddingVertical: size === 'sm' ? SPACING.sm : size === 'lg' ? SPACING.lg : SPACING.base,
          paddingHorizontal: size === 'sm' ? SPACING.base : size === 'lg' ? SPACING.xl : SPACING.lg,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          paddingVertical: size === 'sm' ? SPACING.sm : size === 'lg' ? SPACING.lg : SPACING.base,
          paddingHorizontal: size === 'sm' ? SPACING.base : size === 'lg' ? SPACING.xl : SPACING.lg,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: FONTS.semibold as any,
    };

    switch (size) {
      case 'sm':
        return { ...baseTextStyle, fontSize: FONTS.sm };
      case 'lg':
        return { ...baseTextStyle, fontSize: FONTS.lg };
      default:
        return { ...baseTextStyle, fontSize: FONTS.base };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'outline':
        return COLORS.primary;
      case 'ghost':
        return COLORS.primary;
      default:
        return COLORS.white;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[getTextStyle(), { color: getTextColor() }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;
