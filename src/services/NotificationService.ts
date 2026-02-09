/**
 * Notification Service - Handles local notifications using @notifee/react-native
 */

import notifee, {
  AndroidImportance,
  TriggerType,
  TimestampTrigger,
  AuthorizationStatus,
} from '@notifee/react-native';
import {Platform} from 'react-native';
import {Shop, Schedule} from '../types';
import {formatDistance} from './LocationService';

// Notification channel IDs
const CHANNEL_NEARBY = 'shop-nearby';
const CHANNEL_SCHEDULE = 'schedule-reminders';

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

// In-memory store for notification history
let notificationHistory: ShopNotification[] = [];
let lastNotifiedShops: Map<string, number> = new Map();

const NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutes

/**
 * Check if we should notify about a shop (cooldown check)
 */
export const shouldNotifyForShop = (shopId: string): boolean => {
  const lastNotified = lastNotifiedShops.get(shopId);
  if (!lastNotified) return true;
  return Date.now() - lastNotified > NOTIFICATION_COOLDOWN;
};

/**
 * Record that we notified about a shop
 */
export const recordNotification = (shopId: string): void => {
  lastNotifiedShops.set(shopId, Date.now());
};

/**
 * Create a shop proximity notification object
 */
export const createShopNotification = (
  shop: Shop,
  distance: number,
): ShopNotification => {
  const notification: ShopNotification = {
    id: `shop-${shop.id}-${Date.now()}`,
    shopId: shop.id,
    shopName: shop.name,
    title: `${shop.name} is nearby!`,
    body: `You're ${formatDistance(distance)} away. Check your shopping list!`,
    distance,
    timestamp: Date.now(),
  };

  notificationHistory.unshift(notification);
  if (notificationHistory.length > 50) {
    notificationHistory = notificationHistory.slice(0, 50);
  }

  return notification;
};

/**
 * Show a local notification using notifee
 */
export const showLocalNotification = async (
  notification: ShopNotification,
): Promise<void> => {
  recordNotification(notification.shopId);

  try {
    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      android: {
        channelId: CHANNEL_NEARBY,
        smallIcon: 'ic_launcher',
        pressAction: {id: 'default'},
        importance: AndroidImportance.HIGH,
      },
    });
  } catch (error) {
    console.error('Failed to display notification:', error);
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
 * Schedule a reminder notification for a schedule item
 */
export const scheduleReminderNotification = async (
  schedule: Schedule,
  shopName?: string,
): Promise<void> => {
  if (!schedule.reminder || !schedule.reminderMinutes) return;

  try {
    const scheduleDate = new Date(schedule.date);
    if (schedule.time) {
      const timeParts = schedule.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1], 10);
        const minutes = parseInt(timeParts[2], 10);
        const period = timeParts[3];
        if (period?.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (period?.toUpperCase() === 'AM' && hours === 12) hours = 0;
        scheduleDate.setHours(hours, minutes, 0, 0);
      }
    }

    const triggerTime =
      scheduleDate.getTime() - schedule.reminderMinutes * 60 * 1000;

    // Don't schedule if the trigger time is in the past
    if (triggerTime <= Date.now()) return;

    // Cancel any existing notification for this schedule
    await cancelScheduleNotification(schedule.id);

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerTime,
    };

    let body = `Shopping trip: ${schedule.title}`;
    if (shopName) body += ` at ${shopName}`;
    if (schedule.reminderMinutes >= 60) {
      body += ` in ${schedule.reminderMinutes / 60} hour${
        schedule.reminderMinutes > 60 ? 's' : ''
      }`;
    } else {
      body += ` in ${schedule.reminderMinutes} minutes`;
    }

    await notifee.createTriggerNotification(
      {
        id: `schedule-${schedule.id}`,
        title: 'Shopping Reminder',
        body,
        android: {
          channelId: CHANNEL_SCHEDULE,
          smallIcon: 'ic_launcher',
          pressAction: {id: 'default'},
          importance: AndroidImportance.HIGH,
        },
      },
      trigger,
    );
  } catch (error) {
    console.error('Failed to schedule reminder:', error);
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelScheduleNotification = async (
  scheduleId: string,
): Promise<void> => {
  try {
    await notifee.cancelNotification(`schedule-${scheduleId}`);
  } catch (error) {
    console.error('Failed to cancel notification:', error);
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
 * Request notification permissions
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

/**
 * Create notification channels (Android)
 */
export const createNotificationChannel = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_NEARBY,
      name: 'Nearby Shop Alerts',
      description: 'Notifications when you are near a saved shop',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });

    await notifee.createChannel({
      id: CHANNEL_SCHEDULE,
      name: 'Shopping Reminders',
      description: 'Reminders for scheduled shopping trips',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });
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
