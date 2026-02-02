/**
 * Location Service - Handles geofencing and location tracking
 * Note: Full functionality requires react-native-geolocation-service and
 * react-native-background-geolocation packages to be installed
 */

import {Platform, PermissionsAndroid, Alert, Linking} from 'react-native';
import {Shop} from '../types';

// Permission states
export type LocationPermissionStatus = 'granted' | 'denied' | 'never_ask_again' | 'unknown';

/**
 * Request location permissions
 */
export const requestLocationPermission = async (): Promise<LocationPermissionStatus> => {
  if (Platform.OS === 'android') {
    try {
      const fineLocation = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'ShopWell needs access to your location to notify you when near your favorite shops.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (fineLocation === PermissionsAndroid.RESULTS.GRANTED) {
        return 'granted';
      } else if (fineLocation === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return 'never_ask_again';
      }
      return 'denied';
    } catch (err) {
      console.warn('Location permission error:', err);
      return 'unknown';
    }
  }
  
  // iOS would use different approach
  return 'unknown';
};

/**
 * Request background location permission (Android 10+)
 */
export const requestBackgroundLocationPermission = async (): Promise<LocationPermissionStatus> => {
  if (Platform.OS === 'android' && Platform.Version >= 29) {
    try {
      const backgroundLocation = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Background Location Permission',
          message: 'ShopWell needs background location access to notify you when near shops, even when the app is closed.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (backgroundLocation === PermissionsAndroid.RESULTS.GRANTED) {
        return 'granted';
      } else if (backgroundLocation === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return 'never_ask_again';
      }
      return 'denied';
    } catch (err) {
      console.warn('Background location permission error:', err);
      return 'unknown';
    }
  }
  
  return 'granted'; // Not needed for older Android versions
};

/**
 * Check if location permissions are granted
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const fineLocation = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return fineLocation;
  }
  return false;
};

/**
 * Open app settings for manual permission granting
 */
export const openLocationSettings = () => {
  Alert.alert(
    'Location Permission Required',
    'Please enable location permissions in your device settings to receive notifications when near shops.',
    [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Open Settings', onPress: () => Linking.openSettings()},
    ],
  );
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Check if a position is within a shop's geofence
 */
export const isWithinGeofence = (
  userLat: number,
  userLon: number,
  shop: Shop,
): boolean => {
  if (!shop.latitude || !shop.longitude) {
    return false;
  }

  const distance = calculateDistance(userLat, userLon, shop.latitude, shop.longitude);
  const radius = shop.geofenceRadius || 200;

  return distance <= radius;
};

/**
 * Get all shops within range of a location
 */
export const getShopsInRange = (
  userLat: number,
  userLon: number,
  shops: Shop[],
): Array<{shop: Shop; distance: number}> => {
  return shops
    .filter(shop => shop.latitude && shop.longitude && shop.notifyOnNearby)
    .map(shop => ({
      shop,
      distance: calculateDistance(userLat, userLon, shop.latitude!, shop.longitude!),
    }))
    .filter(item => item.distance <= (item.shop.geofenceRadius || 200))
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

// Placeholder for full geofencing implementation
// This would require react-native-background-geolocation for production use
export class GeofenceManager {
  private static instance: GeofenceManager;
  private isMonitoring: boolean = false;
  private monitoredShops: Shop[] = [];

  static getInstance(): GeofenceManager {
    if (!GeofenceManager.instance) {
      GeofenceManager.instance = new GeofenceManager();
    }
    return GeofenceManager.instance;
  }

  async startMonitoring(shops: Shop[]): Promise<boolean> {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      console.log('Location permission not granted');
      return false;
    }

    this.monitoredShops = shops.filter(
      s => s.latitude && s.longitude && s.notifyOnNearby,
    );
    this.isMonitoring = true;
    console.log(`Started monitoring ${this.monitoredShops.length} shop geofences`);
    
    // In production, this would set up actual geofences using
    // react-native-background-geolocation
    return true;
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    this.monitoredShops = [];
    console.log('Stopped monitoring shop geofences');
  }

  isActive(): boolean {
    return this.isMonitoring;
  }

  getMonitoredShops(): Shop[] {
    return this.monitoredShops;
  }
}
