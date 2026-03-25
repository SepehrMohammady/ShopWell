/**
 * Settings Screen
 */

import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity, Switch, Image, Modal, TextInput} from 'react-native';
import {Card} from '../components/common';
import {Spacing, FontSize, APP_VERSION} from '../constants';
import {StorageService} from '../services/StorageService';
import {exportAndShare, pickAndImport} from '../services/BackupService';
import {useApp} from '../context/AppContext';
import {useTheme, ThemeMode} from '../context/ThemeContext';
import {
  requestLocationPermission,
  checkLocationPermission,
  openLocationSettings,
} from '../services/LocationService';
import {defaultSettings, PREDEFINED_CURRENCIES} from '../types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SettingsScreen: React.FC = () => {
  const {state, dispatch, updateSettings} = useApp();
  const {colors, themeMode, setThemeMode} = useTheme();
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showCustomCurrencyModal, setShowCustomCurrencyModal] = useState(false);
  const [customCurrencyInput, setCustomCurrencyInput] = useState('');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAndShare(state);
    } catch (error: any) {
      Alert.alert('Export Failed', error?.message || 'Could not export data.');
    }
    setIsExporting(false);
  };

  const handleImport = async () => {
    Alert.alert(
      'Restore Backup',
      'This will replace ALL current data with the backup. Are you sure?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setIsImporting(true);
            try {
              const importedState = await pickAndImport();
              if (importedState) {
                dispatch({type: 'SET_STATE', payload: importedState});
                Alert.alert(
                  'Restore Complete',
                  `Restored ${importedState.products.length} products, ${importedState.shops.length} shops, ${importedState.schedules.length} schedules, and ${importedState.shopProductBrands.length} price entries.`,
                );
              }
            } catch (error: any) {
              Alert.alert('Restore Failed', error?.message || 'Could not import data.');
            }
            setIsImporting(false);
          },
        },
      ],
    );
  };

  const handleToggleLocationNotifications = async () => {
    const newValue = !state.settings.locationNotificationsEnabled;
    
    if (newValue) {
      setIsCheckingPermission(true);
      
      // Request location permission
      const locationStatus = await requestLocationPermission();
      
      if (locationStatus === 'granted') {
        updateSettings({locationNotificationsEnabled: true});
        const shopsWithLocation = state.shops.filter(
          s => s.latitude && s.longitude && s.notifyOnNearby,
        );
        Alert.alert(
          'Nearby Shop Detection Enabled',
          `Will check proximity to ${shopsWithLocation.length} shop${shopsWithLocation.length !== 1 ? 's' : ''} while the app is open.`,
        );
      } else if (locationStatus === 'never_ask_again') {
        openLocationSettings();
      } else {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to detect nearby shops.',
        );
      }
      
      setIsCheckingPermission(false);
    } else {
      updateSettings({locationNotificationsEnabled: false});
    }
  };

  const handleRadiusChange = (radius: number) => {
    updateSettings({defaultGeofenceRadius: radius});
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all your shopping lists, shops, schedules, and products? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearAppState();
            dispatch({
              type: 'SET_STATE',
              payload: {
                shoppingLists: [],
                shops: [],
                schedules: [],
                products: [],
                shopProductBrands: [],
                settings: defaultSettings,
              },
            });
            Alert.alert('Success', 'All data has been cleared.');
          },
        },
      ],
    );
  };

  const themeModes: {label: string; value: ThemeMode}[] = [
    {label: 'Light', value: 'light'},
    {label: 'Dark', value: 'dark'},
    {label: 'System', value: 'system'},
  ];

  const userCurrencies = state.settings.currencies || defaultSettings.currencies;
  const activeCurrency = state.settings.currency || '€';

  const handleSelectCurrency = (c: string) => {
    updateSettings({currency: c});
  };

  const handleAddCurrency = () => {
    // Show currencies not already added
    const available = PREDEFINED_CURRENCIES.filter(c => !userCurrencies.includes(c));
    if (available.length === 0) {
      // All predefined added, offer custom
      handleCreateCustomCurrency();
      return;
    }
    const buttons = available.slice(0, 8).map(c => ({
      text: c,
      onPress: () => {
        const updated = [...userCurrencies, c];
        updateSettings({currencies: updated, currency: c});
      },
    }));
    buttons.push({
      text: 'Custom...',
      onPress: () => handleCreateCustomCurrency(),
    });
    buttons.push({text: 'Cancel', onPress: () => {}});
    Alert.alert('Add Currency', 'Choose a currency to add', buttons);
  };

  const handleCreateCustomCurrency = () => {
    setCustomCurrencyInput('');
    setShowCustomCurrencyModal(true);
  };

  const handleConfirmCustomCurrency = () => {
    const symbol = customCurrencyInput.trim();
    if (!symbol) {
      setShowCustomCurrencyModal(false);
      return;
    }
    if (symbol.length > 5) {
      Alert.alert('Error', 'Currency symbol should be 5 characters or less.');
      return;
    }
    if (userCurrencies.includes(symbol)) {
      Alert.alert('Already exists', 'This currency is already in your list.');
      setShowCustomCurrencyModal(false);
      return;
    }
    const updated = [...userCurrencies, symbol];
    updateSettings({currencies: updated, currency: symbol});
    setShowCustomCurrencyModal(false);
  };

  const handleRemoveCurrency = (c: string) => {
    if (userCurrencies.length <= 1) {
      Alert.alert('Cannot Remove', 'You must have at least one currency.');
      return;
    }
    const updated = userCurrencies.filter(cur => cur !== c);
    const newSettings: Partial<typeof state.settings> = {currencies: updated};
    if (activeCurrency === c) {
      newSettings.currency = updated[0];
    }
    updateSettings(newSettings as any);
  };

  return (
    <ScrollView style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.content}>
        {/* App Header with Logo */}
        <View style={styles.appHeader}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, {color: colors.text}]}>ShopWell</Text>
          <Text style={[styles.appTagline, {color: colors.textSecondary}]}>
            Smart Shopping Management
          </Text>
        </View>

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

        <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>Currency</Text>
        <Card>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, {color: colors.text}]}>Active Currency</Text>
            <Text style={[styles.settingValue, {color: colors.primary}]}>{activeCurrency}</Text>
          </View>
          <View style={[styles.divider, {backgroundColor: colors.border}]} />
          <View style={styles.currencyGrid}>
            {userCurrencies.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.currencyChip,
                  {
                    backgroundColor: activeCurrency === c ? colors.primary : colors.surface,
                    borderColor: activeCurrency === c ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleSelectCurrency(c)}
                onLongPress={() => handleRemoveCurrency(c)}>
                <Text
                  style={[
                    styles.currencyChipText,
                    {color: activeCurrency === c ? colors.textInverse : colors.text},
                  ]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.currencyChip, styles.currencyAddChip, {borderColor: colors.border}]}
              onPress={handleAddCurrency}>
              <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.settingHint, {color: colors.textLight}]}>
            Tap to select • Long-press to remove
          </Text>
        </Card>

        <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>Nearby Shop Detection</Text>
        <Card>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, {color: colors.text}]}>
                Detect nearby shops
              </Text>
              <Text style={[styles.settingDescription, {color: colors.textSecondary}]}>
                Show a banner when you're near a saved shop while the app is open
              </Text>
            </View>
            <Switch
              value={state.settings.locationNotificationsEnabled}
              onValueChange={handleToggleLocationNotifications}
              trackColor={{false: colors.border, true: colors.primary + '80'}}
              thumbColor={state.settings.locationNotificationsEnabled ? colors.primary : colors.surface}
              disabled={isCheckingPermission}
            />
          </View>
          
          {state.settings.locationNotificationsEnabled && (
            <>
              <View style={[styles.divider, {backgroundColor: colors.border}]} />
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, {color: colors.text}]}>
                  Default detection radius
                </Text>
              </View>
              <View style={styles.radiusSelector}>
                {[100, 200, 500, 1000].map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    style={[
                      styles.radiusOption,
                      {
                        backgroundColor: state.settings.defaultGeofenceRadius === radius
                          ? colors.primary
                          : colors.surface,
                        borderColor: state.settings.defaultGeofenceRadius === radius
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => handleRadiusChange(radius)}
                  >
                    <Text
                      style={[
                        styles.radiusOptionText,
                        {color: state.settings.defaultGeofenceRadius === radius
                          ? colors.white
                          : colors.text},
                      ]}
                    >
                      {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.divider, {backgroundColor: colors.border}]} />
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, {color: colors.text}]}>
                  When near a shop
                </Text>
              </View>
              <View style={styles.radiusSelector}>
                {([{label: 'Suggest', value: 'suggest'}, {label: 'Auto-open', value: 'auto-open'}] as const).map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.radiusOption,
                      {
                        backgroundColor: state.settings.nearbyShopAction === option.value
                          ? colors.primary
                          : colors.surface,
                        borderColor: state.settings.nearbyShopAction === option.value
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => updateSettings({nearbyShopAction: option.value})}
                  >
                    <Text
                      style={[
                        styles.radiusOptionText,
                        {color: state.settings.nearbyShopAction === option.value
                          ? colors.white
                          : colors.text},
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.settingHint, {color: colors.textLight}]}>
                {state.settings.nearbyShopAction === 'suggest'
                  ? 'Show a banner to open shop mode'
                  : 'Automatically open shop mode when nearby'}
              </Text>
              <Text style={[styles.settingHint, {color: colors.textLight}]}>
                {state.shops.filter(s => s.notifyOnNearby).length} shops configured for detection
              </Text>
            </>
          )}
        </Card>

        <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>About</Text>
        <Card>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, {color: colors.text}]}>App Version</Text>
            <Text style={[styles.settingValue, {color: colors.textSecondary}]}>{APP_VERSION}</Text>
          </View>
          <View style={[styles.divider, {backgroundColor: colors.border}]} />
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, {color: colors.text}]}>Developer</Text>
            <Text style={[styles.settingValue, {color: colors.textSecondary}]}>Sepehr Mohammady</Text>
          </View>
          <View style={[styles.divider, {backgroundColor: colors.border}]} />
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => Linking.openURL('https://github.com/SepehrMohammady/ShopWell')}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, {color: colors.text}]}>Source Code</Text>
              <Text style={[styles.settingDescription, {color: colors.textSecondary}]}>
                github.com/SepehrMohammady/ShopWell
              </Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </Card>

        <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>Backup & Restore</Text>
        <Card onPress={handleExport}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <MaterialCommunityIcons name="export-variant" size={20} color={colors.primary} style={{marginRight: Spacing.sm}} />
                <Text style={[styles.settingLabel, {color: colors.text}]}>Export Backup</Text>
              </View>
              <Text style={[styles.settingDescription, {color: colors.textSecondary}]}>
                Save all data as a backup archive
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textLight} />
          </View>
        </Card>
        <Card onPress={handleImport}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <MaterialCommunityIcons name="import" size={20} color={colors.success} style={{marginRight: Spacing.sm}} />
                <Text style={[styles.settingLabel, {color: colors.text}]}>Restore Backup</Text>
              </View>
              <Text style={[styles.settingDescription, {color: colors.textSecondary}]}>
                Import data from a backup file
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textLight} />
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

        <View style={styles.footer}>
          <Text style={[styles.footerText, {color: colors.textSecondary}]}>
            Made with love for better shopping
          </Text>
        </View>
      </View>

      <Modal
        visible={showCustomCurrencyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomCurrencyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: colors.surface}]}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>Custom Currency</Text>
            <Text style={[styles.modalDescription, {color: colors.textSecondary}]}>
              Enter a currency symbol (e.g., ₿, MAD, BTC)
            </Text>
            <TextInput
              style={[styles.modalInput, {color: colors.text, borderColor: colors.border, backgroundColor: colors.background}]}
              value={customCurrencyInput}
              onChangeText={setCustomCurrencyInput}
              placeholder="Symbol"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              maxLength={5}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: colors.background}]}
                onPress={() => setShowCustomCurrencyModal(false)}>
                <Text style={[styles.modalButtonText, {color: colors.text}]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: colors.primary}]}
                onPress={handleConfirmCustomCurrency}>
                <Text style={[styles.modalButtonText, {color: colors.textInverse}]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  appHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  appTagline: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
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
  settingInfo: {
    flex: 1,
    marginRight: Spacing.base,
  },
  settingLabel: {
    fontSize: FontSize.base,
  },
  settingDescription: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  settingHint: {
    fontSize: FontSize.xs,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
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
  radiusSelector: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  radiusOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  radiusOptionText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  currencyChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 48,
    alignItems: 'center',
  },
  currencyChipText: {
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  currencyAddChip: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
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
    fontSize: FontSize.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  modalDescription: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: FontSize.base,
    fontWeight: '500',
  },
});

export default SettingsScreen;
