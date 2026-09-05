/**
 * Location Service - Handles geofencing and location tracking
 * Note: Full functionality requires react-native-geolocation-service and
 * react-native-background-geolocation packages to be installed
 */

import {Platform, PermissionsAndroid, Linking} from 'react-native';
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
  Linking.openSettings();
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
 * Check if a position is within any of a shop's geofences (primary + addresses)
 */
export const isWithinGeofence = (
  userLat: number,
  userLon: number,
  shop: Shop,
): boolean => {
  // Check primary location
  if (shop.latitude && shop.longitude) {
    const distance = calculateDistance(userLat, userLon, shop.latitude, shop.longitude);
    const radius = shop.geofenceRadius || 200;
    if (distance <= radius) return true;
  }

  // Check additional addresses
  if (shop.addresses) {
    for (const addr of shop.addresses) {
      if (addr.latitude && addr.longitude) {
        const distance = calculateDistance(userLat, userLon, addr.latitude, addr.longitude);
        const radius = addr.geofenceRadius || 200;
        if (distance <= radius) return true;
      }
    }
  }

  return false;
};

/**
 * Get all shops within range of a location (checks all addresses/branches)
 */
export const getShopsInRange = (
  userLat: number,
  userLon: number,
  shops: Shop[],
): Array<{shop: Shop; distance: number}> => {
  const results: Array<{shop: Shop; distance: number}> = [];

  for (const shop of shops) {
    if (!shop.notifyOnNearby) continue;

    let closestDistance = Infinity;

    // Check primary location
    if (shop.latitude && shop.longitude) {
      const dist = calculateDistance(userLat, userLon, shop.latitude, shop.longitude);
      if (dist <= (shop.geofenceRadius || 200)) {
        closestDistance = Math.min(closestDistance, dist);
      }
    }

    // Check additional addresses
    if (shop.addresses) {
      for (const addr of shop.addresses) {
        if (addr.latitude && addr.longitude && addr.notifyOnNearby !== false) {
          const dist = calculateDistance(userLat, userLon, addr.latitude, addr.longitude);
          if (dist <= (addr.geofenceRadius || 200)) {
            closestDistance = Math.min(closestDistance, dist);
          }
        }
      }
    }

    if (closestDistance < Infinity) {
      results.push({shop, distance: closestDistance});
    }
  }

  return results.sort((a, b) => a.distance - b.distance);
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
