/**
 * Background Worker Service
 * Uses react-native-background-fetch (Android WorkManager) for periodic background tasks:
 * - Location-based nearby shop notifications
 * - Schedule reminder checks
 * Works offline, no cloud/server needed.
 */

import BackgroundFetch from 'react-native-background-fetch';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Shop, Schedule, AppSettings} from '../types';
import {getShopsInRange} from './LocationService';
import {
  shouldNotifyForShop,
  showLocalNotification,
  createShopNotification,
  scheduleReminderNotification,
} from './NotificationService';

const STORAGE_KEY = '@ShopWell:state';

/**
 * Read app state directly from AsyncStorage (background task has no React context)
 */
const readStateFromStorage = async (): Promise<{
  shops: Shop[];
  schedules: Schedule[];
  settings: AppSettings;
} | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      shops: parsed.shops || [],
      schedules: parsed.schedules || [],
      settings: parsed.settings || {
        locationNotificationsEnabled: false,
        defaultGeofenceRadius: 200,
        nearbyShopAction: 'suggest',
        currency: '€',
      },
    };
  } catch {
    return null;
  }
};

/**
 * Background task: check location against shop geofences
 */
const checkNearbyShopsBackground = async (): Promise<void> => {
  const state = await readStateFromStorage();
  if (!state || !state.settings.locationNotificationsEnabled) return;

  const shopsWithLocation = state.shops.filter(
    s => s.latitude && s.longitude && s.notifyOnNearby && !s.isOnline,
  );
  if (shopsWithLocation.length === 0) return;

  return new Promise<void>((resolve) => {
    Geolocation.getCurrentPosition(
      async (position) => {
        const inRange = getShopsInRange(
          position.coords.latitude,
          position.coords.longitude,
          shopsWithLocation,
        );

        for (const {shop, distance} of inRange) {
          if (shouldNotifyForShop(shop.id)) {
            const notification = createShopNotification(shop, distance);
            await showLocalNotification(notification);
          }
        }
        resolve();
      },
      () => resolve(), // Silently fail
      {enableHighAccuracy: false, timeout: 15000, maximumAge: 60000},
    );
  });
};

/**
 * Background task: ensure upcoming schedule reminders are registered
 */
const checkScheduleReminders = async (): Promise<void> => {
  const state = await readStateFromStorage();
  if (!state) return;

  const now = Date.now();
  const oneDayFromNow = now + 24 * 60 * 60 * 1000;

  for (const schedule of state.schedules) {
    if (!schedule.reminder || !schedule.reminderMinutes || schedule.isCompleted) continue;

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

    const triggerTime = scheduleDate.getTime() - schedule.reminderMinutes * 60 * 1000;

    // Only re-register if trigger is in the next 24 hours and in the future
    if (triggerTime > now && triggerTime <= oneDayFromNow) {
      const shopName = schedule.shopId
        ? state.shops.find(s => s.id === schedule.shopId)?.name
        : undefined;
      await scheduleReminderNotification(schedule, shopName);
    }
  }
};

/**
 * The main background task handler
 */
const onBackgroundFetch = async (taskId: string) => {
  console.log('[BackgroundWorker] Task:', taskId);

  try {
    await Promise.all([
      checkNearbyShopsBackground(),
      checkScheduleReminders(),
    ]);
  } catch (error) {
    console.error('[BackgroundWorker] Error:', error);
  }

  // Signal completion to the OS
  BackgroundFetch.finish(taskId);
};

/**
 * Handler when the OS terminates a task (Android-only)
 */
const onTimeout = async (taskId: string) => {
  console.warn('[BackgroundWorker] TIMEOUT:', taskId);
  BackgroundFetch.finish(taskId);
};

/**
 * Initialize background worker (call once at app startup)
 */
export const initBackgroundWorker = async (): Promise<void> => {
  try {
    const status = await BackgroundFetch.configure(
      {
        minimumFetchInterval: 15, // minutes (Android minimum with WorkManager)
        stopOnTerminate: false,   // Continue after app is terminated
        startOnBoot: true,        // Start after device reboot
        enableHeadless: true,     // Enable headless mode for Android
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE, // Works offline
        requiresCharging: false,
        requiresDeviceIdle: false,
        requiresBatteryNotLow: false,
      },
      onBackgroundFetch,
      onTimeout,
    );

    console.log('[BackgroundWorker] Configured, status:', status);
  } catch (error) {
    console.error('[BackgroundWorker] Configure failed:', error);
  }
};

/**
 * Register the headless task for Android (call in index.js)
 */
export const registerHeadlessTask = () => {
  BackgroundFetch.registerHeadlessTask(async (event) => {
    const taskId = event.taskId;
    console.log('[BackgroundWorker] Headless task:', taskId);

    try {
      await Promise.all([
        checkNearbyShopsBackground(),
        checkScheduleReminders(),
      ]);
    } catch (error) {
      console.error('[BackgroundWorker] Headless error:', error);
    }

    BackgroundFetch.finish(taskId);
  });
};
