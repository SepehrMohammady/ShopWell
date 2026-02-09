/**
 * Empty State component for when there's no data
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Spacing, FontSize} from '../../constants';
import {useTheme} from '../../context/ThemeContext';
import Button from './Button';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const {colors} = useTheme();

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={64} color={colors.primary} />
      <Text style={[styles.title, {color: colors.text}]}>{title}</Text>
      <Text style={[styles.message, {color: colors.textSecondary}]}>{message}</Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  button: {
    marginTop: Spacing.md,
  },
});

export default EmptyState;
