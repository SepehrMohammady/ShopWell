/**
 * Notification Service - Handles local notifications
 * Note: For production, use @notifee/react-native for full notification support
 */

import {Platform, Alert} from 'react-native';
import {Shop} from '../types';
import {formatDistance} from './LocationService';

// Notification types
export interface ShopNotification {
  id: string;
  shopId: string;
  shopName: string;
  title: string;
  body: string;
  distance?: number;
  timestamp: number;
}

// In-memory store for notification history (would use AsyncStorage in production)
let notificationHistory: ShopNotification[] = [];
let lastNotifiedShops: Map<string, number> = new Map();

// Minimum time between notifications for the same shop (in milliseconds)
const NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutes

/**
 * Check if we should notify about a shop (cooldown check)
 */
export const shouldNotifyForShop = (shopId: string): boolean => {
  const lastNotified = lastNotifiedShops.get(shopId);
  if (!lastNotified) {
    return true;
  }
  return Date.now() - lastNotified > NOTIFICATION_COOLDOWN;
};

/**
 * Record that we notified about a shop
 */
export const recordNotification = (shopId: string): void => {
  lastNotifiedShops.set(shopId, Date.now());
};

/**
 * Create a shop proximity notification
 */
export const createShopNotification = (
  shop: Shop,
  distance: number,
): ShopNotification => {
  const notification: ShopNotification = {
    id: `shop-${shop.id}-${Date.now()}`,
    shopId: shop.id,
    shopName: shop.name,
    title: `🏪 ${shop.name} is nearby!`,
    body: `You're ${formatDistance(distance)} away. Check your shopping list!`,
    distance,
    timestamp: Date.now(),
  };

  notificationHistory.unshift(notification);
  // Keep only last 50 notifications
  if (notificationHistory.length > 50) {
    notificationHistory = notificationHistory.slice(0, 50);
  }

  return notification;
};

/**
 * Show a local notification (placeholder - uses Alert for now)
 * In production, use @notifee/react-native
 */
export const showLocalNotification = async (notification: ShopNotification): Promise<void> => {
  // Record that we notified about this shop
  recordNotification(notification.shopId);

  // For now, use a simple alert - in production this would be a real notification
  // that appears even when app is in background
  if (Platform.OS === 'android') {
    // In production with @notifee/react-native:
    // await notifee.displayNotification({
    //   title: notification.title,
    //   body: notification.body,
    //   android: {
    //     channelId: 'shop-nearby',
    //     smallIcon: 'ic_launcher',
    //     pressAction: { id: 'default' },
    //   },
    // });
    
    // Placeholder: log to console
    console.log('Notification:', notification.title, notification.body);
  }
};

/**
 * Notify about nearby shops
 */
export const notifyNearbyShops = async (
  shopsInRange: Array<{shop: Shop; distance: number}>,
): Promise<void> => {
  for (const {shop, distance} of shopsInRange) {
    if (shouldNotifyForShop(shop.id)) {
      const notification = createShopNotification(shop, distance);
      await showLocalNotification(notification);
    }
  }
};

/**
 * Get notification history
 */
export const getNotificationHistory = (): ShopNotification[] => {
  return [...notificationHistory];
};

/**
 * Clear notification history
 */
export const clearNotificationHistory = (): void => {
  notificationHistory = [];
  lastNotifiedShops.clear();
};

/**
 * Request notification permissions (Android 13+)
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    // In production with @notifee/react-native:
    // const settings = await notifee.requestPermission();
    // return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
    
    // For now, return true as placeholder
    return true;
  }
  return true;
};

/**
 * Create notification channel (Android)
 */
export const createNotificationChannel = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    // In production with @notifee/react-native:
    // await notifee.createChannel({
    //   id: 'shop-nearby',
    //   name: 'Shop Proximity Alerts',
    //   description: 'Notifications when you are near a saved shop',
    //   importance: AndroidImportance.HIGH,
    //   vibration: true,
    // });
    
    console.log('Notification channel created (placeholder)');
  }
};

/**
 * Initialize notification service
 */
export const initializeNotificationService = async (): Promise<boolean> => {
  try {
    await createNotificationChannel();
    const hasPermission = await requestNotificationPermission();
    return hasPermission;
  } catch (error) {
    console.error('Failed to initialize notification service:', error);
    return false;
  }
};
