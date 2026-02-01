/**
 * Input component with flat/minimal design
 */

import React, {forwardRef} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import {Spacing, BorderRadius, FontSize} from '../../constants';
import {useTheme} from '../../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

const Input = forwardRef<TextInput, InputProps>(
  ({label, error, containerStyle, style, ...props}, ref) => {
    const {colors} = useTheme();

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={[styles.label, {color: colors.text}]}>{label}</Text>}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: error ? colors.error : colors.border,
              color: colors.text,
            },
            style,
          ]}
          placeholderTextColor={colors.textLight}
          {...props}
        />
        {error && <Text style={[styles.error, {color: colors.error}]}>{error}</Text>}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    minHeight: 48,
  },
  error: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
});

export default Input;
