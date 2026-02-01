/**
 * Checkbox component with flat/minimal design
 */

import React from 'react';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import {Spacing, BorderRadius, FontSize} from '../../constants';
import {useTheme} from '../../context/ThemeContext';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onToggle,
  label,
  disabled = false,
}) => {
  const {colors} = useTheme();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}>
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked ? colors.primary : colors.surface,
            borderColor: checked ? colors.primary : colors.border,
          },
        ]}>
        {checked && <Text style={[styles.checkmark, {color: colors.textInverse}]}>✓</Text>}
      </View>
      {label && (
        <Text
          style={[
            styles.label,
            {color: checked ? colors.textSecondary : colors.text},
            checked && styles.labelChecked,
          ]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  label: {
    marginLeft: Spacing.md,
    fontSize: FontSize.base,
  },
  labelChecked: {
    textDecorationLine: 'line-through',
  },
});

export default Checkbox;
