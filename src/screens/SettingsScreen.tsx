/**
 * Settings Screen
 */

import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity, Switch, Image} from 'react-native';
import {Card} from '../components/common';
import {Spacing, FontSize, APP_VERSION} from '../constants';
import {StorageService} from '../services/StorageService';
import {useApp} from '../context/AppContext';
import {useTheme, ThemeMode} from '../context/ThemeContext';
import {
  requestLocationPermission,
  requestBackgroundLocationPermission,
  checkLocationPermission,
  openLocationSettings,
  GeofenceManager,
} from '../services/LocationService';
import {initializeNotificationService} from '../services/NotificationService';
import {defaultSettings} from '../types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SettingsScreen: React.FC = () => {
  const {state, dispatch, updateSettings} = useApp();
  const {colors, themeMode, setThemeMode} = useTheme();
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);

  const handleToggleLocationNotifications = async () => {
    const newValue = !state.settings.locationNotificationsEnabled;
    
    if (newValue) {
      setIsCheckingPermission(true);
      
      // Request location permission
      const locationStatus = await requestLocationPermission();
      
      if (locationStatus === 'granted') {
        // Request background location permission
        const bgStatus = await requestBackgroundLocationPermission();
        
        if (bgStatus === 'granted') {
          // Initialize notification service
          await initializeNotificationService();
          
          // Start geofence monitoring
          const shopsWithLocation = state.shops.filter(
            s => s.latitude && s.longitude && s.notifyOnNearby,
          );
          await GeofenceManager.getInstance().startMonitoring(shopsWithLocation);
          
          updateSettings({locationNotificationsEnabled: true});
          Alert.alert(
            'Location Notifications Enabled',
            `Monitoring ${shopsWithLocation.length} shops with location data.`,
          );
        } else if (bgStatus === 'never_ask_again') {
          openLocationSettings();
        } else {
          Alert.alert(
            'Background Location Required',
            'Background location access is needed to notify you when near shops.',
          );
        }
      } else if (locationStatus === 'never_ask_again') {
        openLocationSettings();
      } else {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to notify you when near shops.',
        );
      }
      
      setIsCheckingPermission(false);
    } else {
      // Disable location notifications
      GeofenceManager.getInstance().stopMonitoring();
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

        <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>Location Notifications</Text>
        <Card>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, {color: colors.text}]}>
                Notify when near shops
              </Text>
              <Text style={[styles.settingDescription, {color: colors.textSecondary}]}>
                Get alerts when you're close to saved shops
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
                  Default notification radius
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
              <Text style={[styles.settingHint, {color: colors.textLight}]}>
                {state.shops.filter(s => s.notifyOnNearby).length} shops configured for notifications
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
});

export default SettingsScreen;
