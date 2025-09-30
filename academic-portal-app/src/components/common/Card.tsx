import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof SPACING;
  backgroundColor?: string;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  padding = 'base',
  backgroundColor = COLORS.white 
}) => {
  return (
    <View style={[
      styles.card,
      { 
        padding: SPACING[padding],
        backgroundColor 
      },
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.base,
  },
});

export default Card;
