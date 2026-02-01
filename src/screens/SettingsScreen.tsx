/**
 * Settings Screen
 */

import React from 'react';
import {View, Text, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity} from 'react-native';
import {Card} from '../components/common';
import {Spacing, FontSize, APP_VERSION} from '../constants';
import {StorageService} from '../services/StorageService';
import {useApp} from '../context/AppContext';
import {useTheme, ThemeMode} from '../context/ThemeContext';

const SettingsScreen: React.FC = () => {
  const {dispatch} = useApp();
  const {colors, themeMode, setThemeMode} = useTheme();

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all your shopping lists, shops, and schedules? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearAppState();
            dispatch({
              type: 'SET_STATE',
              payload: {shoppingLists: [], shops: [], schedules: []},
            });
            Alert.alert('Success', 'All data has been cleared.');
          },
        },
      ],
    );
  };

  const handleContact = () => {
    Linking.openURL('mailto:support@shopwell.app');
  };

  const themeModes: {label: string; value: ThemeMode}[] = [
    {label: 'Light', value: 'light'},
    {label: 'Dark', value: 'dark'},
    {label: 'System', value: 'system'},
  ];

  return (
    <ScrollView style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>Appearance</Text>
        <Card>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, {color: colors.text}]}>Theme</Text>
          </View>
          <View style={styles.themeSelector}>
            {themeModes.map((mode) => (
              <TouchableOpacity
                key={mode.value}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: themeMode === mode.value ? colors.primary : colors.surface,
                    borderColor: themeMode === mode.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setThemeMode(mode.value)}
              >
                <Text
                  style={[
                    styles.themeOptionText,
                    {color: themeMode === mode.value ? colors.white : colors.text},
                  ]}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>About</Text>
        <Card>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, {color: colors.text}]}>App Version</Text>
            <Text style={[styles.settingValue, {color: colors.textSecondary}]}>{APP_VERSION}</Text>
          </View>
          <View style={[styles.divider, {backgroundColor: colors.border}]} />
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, {color: colors.text}]}>Platform</Text>
            <Text style={[styles.settingValue, {color: colors.textSecondary}]}>React Native</Text>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>Data</Text>
        <Card onPress={handleClearData}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, {color: colors.error}]}>
              Clear All Data
            </Text>
            <Text style={[styles.arrow, {color: colors.textLight}]}>→</Text>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>Support</Text>
        <Card onPress={handleContact}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, {color: colors.text}]}>Contact Us</Text>
            <Text style={[styles.arrow, {color: colors.textLight}]}>→</Text>
          </View>
        </Card>

        <View style={styles.footer}>
          <Text style={[styles.footerText, {color: colors.textSecondary}]}>
            ShopWell - Smart Shopping Management
          </Text>
          <Text style={[styles.footerSubtext, {color: colors.textLight}]}>
            Made with ❤️ for better shopping
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    marginLeft: Spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  settingLabel: {
    fontSize: FontSize.base,
  },
  settingValue: {
    fontSize: FontSize.base,
  },
  themeSelector: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  themeOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  arrow: {
    fontSize: FontSize.lg,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  footerText: {
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
});

export default SettingsScreen;
