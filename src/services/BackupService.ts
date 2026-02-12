/**
 * Backup & Restore Service
 * Export all app data as CSV, import CSV to restore
 */

import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {pick, types} from 'react-native-document-picker';
import {AppState, Product, Shop, Schedule, ShopProductBrand, AppSettings} from '../types';

// CSV column definitions for each data type
const PRODUCT_COLUMNS = ['id', 'name', 'category', 'isAvailable', 'notes', 'createdAt', 'updatedAt'];
const SHOP_COLUMNS = ['id', 'name', 'address', 'category', 'notes', 'isFavorite', 'isOnline', 'url', 'latitude', 'longitude', 'geofenceRadius', 'notifyOnNearby', 'createdAt', 'updatedAt'];
const SCHEDULE_COLUMNS = ['id', 'title', 'shopId', 'date', 'time', 'isRecurring', 'recurringPattern', 'reminder', 'reminderMinutes', 'notes', 'isCompleted', 'createdAt', 'updatedAt'];
const SPB_COLUMNS = ['id', 'productId', 'shopId', 'brand', 'price', 'currency', 'lastUpdated'];
const SETTINGS_COLUMNS = ['locationNotificationsEnabled', 'defaultGeofenceRadius', 'currency'];

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
const escapeCSV = (value: any): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Parse a CSV value (unescape quotes)
 */
const unescapeCSV = (value: string): string => {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/""/g, '"');
  }
  return value;
};

/**
 * Parse a CSV line handling quoted fields
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
};

/**
 * Build CSV section for a data type
 */
const buildSection = (sectionName: string, columns: string[], rows: any[]): string => {
  const lines: string[] = [];
  lines.push(`[${sectionName}]`);
  lines.push(columns.join(','));
  rows.forEach(row => {
    const values = columns.map(col => escapeCSV(row[col]));
    lines.push(values.join(','));
  });
  lines.push(''); // blank line separator
  return lines.join('\n');
};

/**
 * Export app state to CSV string
 */
export const exportToCSV = (state: AppState): string => {
  const sections: string[] = [];

  sections.push(buildSection('Products', PRODUCT_COLUMNS, state.products));
  sections.push(buildSection('Shops', SHOP_COLUMNS, state.shops));
  sections.push(buildSection('Schedules', SCHEDULE_COLUMNS, state.schedules));
  sections.push(buildSection('ShopProductBrands', SPB_COLUMNS, state.shopProductBrands));
  sections.push(buildSection('Settings', SETTINGS_COLUMNS, [state.settings]));

  return sections.join('\n');
};

/**
 * Parse a CSV section into objects
 */
const parseSection = (headerLine: string, dataLines: string[]): any[] => {
  const columns = headerLine.split(',');
  return dataLines.map(line => {
    const values = parseCSVLine(line);
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = values[idx] !== undefined ? values[idx] : '';
    });
    return obj;
  });
};

/**
 * Convert parsed row to a Product
 */
const toProduct = (row: any): Product => ({
  id: row.id,
  name: row.name,
  category: row.category || 'other',
  isAvailable: row.isAvailable === 'true',
  notes: row.notes || undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/**
 * Convert parsed row to a Shop
 */
const toShop = (row: any): Shop => ({
  id: row.id,
  name: row.name,
  address: row.address || undefined,
  category: row.category || 'other',
  notes: row.notes || undefined,
  isFavorite: row.isFavorite === 'true',
  isOnline: row.isOnline === 'true' ? true : undefined,
  url: row.url || undefined,
  latitude: row.latitude ? parseFloat(row.latitude) : undefined,
  longitude: row.longitude ? parseFloat(row.longitude) : undefined,
  geofenceRadius: row.geofenceRadius ? parseInt(row.geofenceRadius, 10) : undefined,
  notifyOnNearby: row.notifyOnNearby === 'true' ? true : undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/**
 * Convert parsed row to a Schedule
 */
const toSchedule = (row: any): Schedule => ({
  id: row.id,
  title: row.title,
  shopId: row.shopId || undefined,
  date: row.date,
  time: row.time || undefined,
  isRecurring: row.isRecurring === 'true',
  recurringPattern: row.recurringPattern || undefined,
  reminder: row.reminder === 'true',
  reminderMinutes: row.reminderMinutes ? parseInt(row.reminderMinutes, 10) : undefined,
  notes: row.notes || undefined,
  isCompleted: row.isCompleted === 'true',
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/**
 * Convert parsed row to a ShopProductBrand
 */
const toSPB = (row: any): ShopProductBrand => ({
  id: row.id,
  productId: row.productId,
  shopId: row.shopId,
  brand: row.brand,
  price: parseFloat(row.price) || 0,
  currency: row.currency || '€',
  lastUpdated: row.lastUpdated,
});

/**
 * Convert parsed row to AppSettings
 */
const toSettings = (row: any): AppSettings => ({
  locationNotificationsEnabled: row.locationNotificationsEnabled === 'true',
  defaultGeofenceRadius: parseInt(row.defaultGeofenceRadius, 10) || 200,
  currency: row.currency || '€',
});

/**
 * Import CSV string to AppState
 */
export const importFromCSV = (csv: string): AppState => {
  const lines = csv.split(/\r?\n/);
  const state: AppState = {
    shoppingLists: [],
    shops: [],
    schedules: [],
    products: [],
    shopProductBrands: [],
    settings: {locationNotificationsEnabled: false, defaultGeofenceRadius: 200, currency: '€'},
  };

  let currentSection = '';
  let headerLine = '';
  let dataLines: string[] = [];

  const flushSection = () => {
    if (!currentSection || !headerLine) return;
    const rows = parseSection(headerLine, dataLines);

    switch (currentSection) {
      case 'Products':
        state.products = rows.map(toProduct);
        break;
      case 'Shops':
        state.shops = rows.map(toShop);
        break;
      case 'Schedules':
        state.schedules = rows.map(toSchedule);
        break;
      case 'ShopProductBrands':
        state.shopProductBrands = rows.map(toSPB);
        break;
      case 'Settings':
        if (rows.length > 0) state.settings = toSettings(rows[0]);
        break;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Section header
    const sectionMatch = trimmed.match(/^\[(\w+)\]$/);
    if (sectionMatch) {
      flushSection();
      currentSection = sectionMatch[1];
      headerLine = '';
      dataLines = [];
      continue;
    }

    // Skip empty lines
    if (!trimmed) continue;

    // First non-empty line after section header is the column header
    if (currentSection && !headerLine) {
      headerLine = trimmed;
      continue;
    }

    // Data line
    if (currentSection && headerLine) {
      dataLines.push(trimmed);
    }
  }

  // Flush last section
  flushSection();

  return state;
};

/**
 * Export data and share as CSV file
 */
export const exportAndShare = async (state: AppState): Promise<boolean> => {
  try {
    const csv = exportToCSV(state);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `ShopWell_Backup_${timestamp}.csv`;
    const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

    await RNFS.writeFile(filePath, csv, 'utf8');

    await Share.open({
      url: `file://${filePath}`,
      type: 'text/csv',
      filename: fileName,
      title: 'Export ShopWell Backup',
      subject: 'ShopWell Backup',
    });

    return true;
  } catch (error: any) {
    // User cancelled share
    if (error?.message?.includes('User did not share')) {
      return false;
    }
    console.error('Export failed:', error);
    throw error;
  }
};

/**
 * Pick a CSV file and import data
 */
export const pickAndImport = async (): Promise<AppState | null> => {
  try {
    const result = await pick({
      type: [types.csv, types.plainText, types.allFiles],
    });

    if (!result || result.length === 0) return null;

    const file = result[0];
    if (!file.uri) return null;

    // Read file content
    let content: string;
    // Handle content:// URIs on Android
    if (file.uri.startsWith('content://')) {
      content = await RNFS.readFile(file.uri, 'utf8');
    } else {
      const path = decodeURIComponent(file.uri.replace('file://', ''));
      content = await RNFS.readFile(path, 'utf8');
    }

    if (!content.includes('[Products]') && !content.includes('[Shops]')) {
      throw new Error('Invalid backup file. Please select a ShopWell backup CSV file.');
    }

    return importFromCSV(content);
  } catch (error: any) {
    if (error?.message?.includes('canceled') || error?.message?.includes('cancelled')) {
      return null;
    }
    throw error;
  }
};
