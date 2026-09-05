/**
 * Notification Service - Handles local notifications using @notifee/react-native
 */

import notifee, {
  AndroidImportance,
  TriggerType,
  TimestampTrigger,
  AuthorizationStatus,
  AlarmType,
  RepeatFrequency,
} from '@notifee/react-native';
import {Platform} from 'react-native';
import {Shop, Schedule} from '../types';
import {formatDistance} from './LocationService';
import {
  RecurringPattern,
  addOccurrences,
  getNextOccurrenceIndex,
  getScheduleDateTime,
} from '../utils/scheduleRecurrence';

// Notification channel IDs
const CHANNEL_NEARBY = 'shop-nearby';
const CHANNEL_SCHEDULE = 'schedule-reminders';

// All schedule alarms share this id prefix so they can be found and cleared.
const SCHEDULE_ID_PREFIX = 'schedule-';

// notifee repeats daily and weekly itself. It has no monthly frequency, so a
// year of monthly occurrences is armed up front instead.
const MONTHLY_LOOKAHEAD = 12;

const REPEAT_FREQUENCY: Record<RecurringPattern, RepeatFrequency | undefined> = {
  daily: RepeatFrequency.DAILY,
  weekly: RepeatFrequency.WEEKLY,
  monthly: undefined,
};

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
 * Notification id for one occurrence of a schedule. Occurrence 0 keeps the bare
 * id so alarms created by older versions are still recognised and cleared.
 */
const buildScheduleNotificationId = (
  scheduleId: string,
  occurrence: number,
): string =>
  occurrence === 0
    ? `${SCHEDULE_ID_PREFIX}${scheduleId}`
    : `${SCHEDULE_ID_PREFIX}${scheduleId}-${occurrence}`;

/**
 * Ids of the alarms currently armed for one schedule, or for all of them when
 * no schedule is given.
 */
const findArmedScheduleIds = async (scheduleId?: string): Promise<string[]> => {
  const ids = await notifee.getTriggerNotificationIds();

  if (!scheduleId) {
    return ids.filter(id => id.startsWith(SCHEDULE_ID_PREFIX));
  }

  const base = `${SCHEDULE_ID_PREFIX}${scheduleId}`;
  return ids.filter(id => id === base || id.startsWith(`${base}-`));
};

/**
 * Cancel every alarm armed for a schedule.
 */
export const cancelScheduleNotification = async (
  scheduleId: string,
): Promise<void> => {
  try {
    const armed = await findArmedScheduleIds(scheduleId);
    await Promise.all(armed.map(id => notifee.cancelNotification(id)));
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
};

/**
 * Arm the reminder for a schedule, replacing whatever was armed for it before.
 *
 * Repeats are handed to notifee's own daily/weekly frequency where it has one,
 * so they keep firing without the app being opened. Monthly has no native
 * frequency, so a year of occurrences is armed at once. Everything runs on the
 * device's AlarmManager - no server, no push, no background service.
 */
export const scheduleReminderNotification = async (
  schedule: Schedule,
  shopName?: string,
): Promise<void> => {
  try {
    // Always clear first, so a schedule that moved into the past, was completed,
    // or had its reminder switched off never leaves a stale alarm behind.
    await cancelScheduleNotification(schedule.id);

    if (!schedule.reminder || schedule.isCompleted) return;

    const due = getScheduleDateTime(schedule);
    const reminderOffset = (schedule.reminderMinutes || 0) * 60 * 1000;
    const pattern = schedule.isRecurring ? schedule.recurringPattern : undefined;
    const notBefore = new Date(Date.now() + reminderOffset);

    // For a repeat, start at the first occurrence still in the future, so a
    // schedule saved after today's time has passed arms the next one instead
    // of nothing. Steps are counted from the original date to avoid drift.
    const firstStep = pattern
      ? getNextOccurrenceIndex(due, pattern, notBefore)
      : 0;

    const repeatFrequency = pattern ? REPEAT_FREQUENCY[pattern] : undefined;
    const occurrences =
      pattern && repeatFrequency === undefined ? MONTHLY_LOOKAHEAD : 1;

    let body = `Shopping trip: ${schedule.title}`;
    if (shopName) body += ` at ${shopName}`;

    for (let i = 0; i < occurrences; i++) {
      const occurrenceDue = pattern
        ? addOccurrences(due, pattern, firstStep + i)
        : due;
      const triggerTime = occurrenceDue.getTime() - reminderOffset;

      // A one-off whose moment has passed simply gets no alarm.
      if (triggerTime <= Date.now()) continue;

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTime,
        alarmManager: {
          type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
        },
      };
      if (repeatFrequency !== undefined) {
        trigger.repeatFrequency = repeatFrequency;
      }

      await notifee.createTriggerNotification(
        {
          id: buildScheduleNotificationId(schedule.id, i),
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
    }
  } catch (error) {
    console.error('Failed to schedule reminder:', error);
  }
};

/**
 * Re-arm every schedule reminder from the app's own data.
 *
 * Android drops pending alarms on reboot, app update and force-stop, and a
 * repeat that notifee was tracking goes with them. Running this at startup
 * means the stored schedules are the single source of truth, so reminders
 * recover by themselves instead of going quiet after the first one fires.
 */
export const syncScheduleNotifications = async (
  schedules: Schedule[],
  shops: Shop[],
): Promise<void> => {
  try {
    // Clear everything first, including alarms whose schedule has been deleted.
    const armed = await findArmedScheduleIds();
    await Promise.all(armed.map(id => notifee.cancelNotification(id)));

    for (const schedule of schedules) {
      if (!schedule.reminder || schedule.isCompleted) continue;

      const shopName = schedule.shopId
        ? shops.find(s => s.id === schedule.shopId)?.name
        : undefined;
      await scheduleReminderNotification(schedule, shopName);
    }
  } catch (error) {
    console.error('Failed to sync schedule reminders:', error);
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
