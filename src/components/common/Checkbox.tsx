/**
 * Checkbox component with flat/minimal design
 */

import React from 'react';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import {Colors, Spacing, BorderRadius, FontSize} from '../../constants';

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
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      {label && (
        <Text style={[styles.label, checked && styles.labelChecked]}>
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
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  label: {
    marginLeft: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.text,
  },
  labelChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
});

export default Checkbox;
