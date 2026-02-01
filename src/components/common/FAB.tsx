/**
 * Floating Action Button component
 */

import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle} from 'react-native';
import {BorderRadius} from '../../constants';
import {useTheme} from '../../context/ThemeContext';

interface FABProps {
  onPress: () => void;
  icon?: string;
  style?: ViewStyle;
}

const FAB: React.FC<FABProps> = ({onPress, icon = '+', style}) => {
  const {colors} = useTheme();

  return (
    <TouchableOpacity
      style={[styles.fab, {backgroundColor: colors.primary, shadowColor: colors.shadow}, style]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Text style={[styles.icon, {color: colors.textInverse}]}>{icon}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: {
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
});

export default FAB;
