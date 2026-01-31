/**
 * Settings Screen
 */

import React from 'react';
import {View, Text, StyleSheet, ScrollView, Alert, Linking} from 'react-native';
import {Card} from '../components/common';
import {Colors, Spacing, FontSize} from '../constants';
import {StorageService} from '../services/StorageService';
import {useApp} from '../context/AppContext';

const APP_VERSION = '0.0.1';

const SettingsScreen: React.FC = () => {
  const {dispatch} = useApp();

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>About</Text>
        <Card>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>App Version</Text>
            <Text style={styles.settingValue}>{APP_VERSION}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Platform</Text>
            <Text style={styles.settingValue}>React Native</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Data</Text>
        <Card onPress={handleClearData}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, styles.dangerText]}>
              Clear All Data
            </Text>
            <Text style={styles.arrow}>→</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Support</Text>
        <Card onPress={handleContact}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Contact Us</Text>
            <Text style={styles.arrow}>→</Text>
          </View>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ShopWell - Smart Shopping Management
          </Text>
          <Text style={styles.footerSubtext}>
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
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.base,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
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
    color: Colors.text,
  },
  settingValue: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  dangerText: {
    color: Colors.error,
  },
  arrow: {
    fontSize: FontSize.lg,
    color: Colors.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  footerText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
});

export default SettingsScreen;
