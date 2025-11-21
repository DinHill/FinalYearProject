import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  containerStyle,
  autoFocus = false,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <MaterialCommunityIcons name="magnify" size={20} color={COLORS.gray} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
      />
      {value.length > 0 && (
        <MaterialCommunityIcons
          name="close-circle"
          size={20}
          color={COLORS.gray}
          onPress={() => onChangeText('')}
          style={styles.clearIcon}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
    borderRadius: BORDER_RADIUS.base,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  input: {
    flex: 1,
    fontSize: FONTS.base,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    paddingVertical: 0, // Remove extra padding on Android
  },
  clearIcon: {
    padding: SPACING.xs,
  },
});

export default SearchBar;
