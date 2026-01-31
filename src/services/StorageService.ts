/**
 * Storage Service for persisting app data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppState} from '../types';

const STORAGE_KEY = '@shopwell_app_state';

export const StorageService = {
  async saveAppState(state: AppState): Promise<void> {
    try {
      const jsonValue = JSON.stringify(state);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving app state:', error);
    }
  },

  async loadAppState(): Promise<AppState | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error loading app state:', error);
      return null;
    }
  },

  async clearAppState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing app state:', error);
    }
  },
};
