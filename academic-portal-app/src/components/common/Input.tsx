import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONTS, BORDER_RADIUS, SPACING } from '../../constants/theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  disabled = false,
  style,
  inputStyle,
  labelStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          disabled && styles.inputDisabled,
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium as any,
    color: COLORS.grayDark,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: BORDER_RADIUS.base,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    backgroundColor: COLORS.grayLight,
    color: COLORS.gray,
  },
  errorText: {
    fontSize: FONTS.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});

export default Input;
