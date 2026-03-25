/**
 * Backup & Restore Service
 * Export all app data as a ZIP archive (CSV + product images)
 * Import ZIP to fully restore data including images on any device
 */

import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {pick, types} from 'react-native-document-picker';
import {zip, unzip} from 'react-native-zip-archive';
import {AppState, Product, Shop, Schedule, ShopProductBrand, AppSettings} from '../types';
import {getImageFilename, buildImageUri, ensureImagesDir, getImagesDir} from './ImageService';

// CSV column definitions for each data type
const PRODUCT_COLUMNS = ['id', 'name', 'category', 'isAvailable', 'notes', 'imageUri', 'createdAt', 'updatedAt'];
const SHOP_COLUMNS = ['id', 'name', 'address', 'category', 'notes', 'isFavorite', 'isOnline', 'url', 'latitude', 'longitude', 'geofenceRadius', 'notifyOnNearby', 'createdAt', 'updatedAt'];
const SCHEDULE_COLUMNS = ['id', 'title', 'shopId', 'productIds', 'date', 'time', 'isRecurring', 'recurringPattern', 'reminder', 'reminderMinutes', 'notes', 'isCompleted', 'createdAt', 'updatedAt'];
const SPB_COLUMNS = ['id', 'productId', 'shopId', 'brand', 'price', 'currency', 'quantity', 'unit', 'lastUpdated'];
const SETTINGS_COLUMNS = ['locationNotificationsEnabled', 'defaultGeofenceRadius', 'nearbyShopAction', 'currency'];

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
 * Image URIs are stored as filenames only (images are in the ZIP)
 */
export const exportToCSV = (state: AppState): string => {
  const sections: string[] = [];

  // For products, convert imageUri to just the filename
  const productsForExport = state.products.map(p => ({
    ...p,
    imageUri: p.imageUri ? getImageFilename(p.imageUri) : undefined,
  }));

  sections.push(buildSection('Products', PRODUCT_COLUMNS, productsForExport));
  sections.push(buildSection('Shops', SHOP_COLUMNS, state.shops));

  // Flatten productIds array to pipe-separated string for CSV
  const schedulesForExport = state.schedules.map(s => ({
    ...s,
    productIds: s.productIds?.join('|') || '',
  }));
  sections.push(buildSection('Schedules', SCHEDULE_COLUMNS, schedulesForExport));
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
  imageUri: row.imageUri || undefined,
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
  productIds: row.productIds ? row.productIds.split('|').filter((s: string) => s) : undefined,
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
  quantity: row.quantity ? parseFloat(row.quantity) : undefined,
  unit: row.unit || undefined,
  lastUpdated: row.lastUpdated,
});

/**
 * Convert parsed row to AppSettings
 */
const toSettings = (row: any): AppSettings => ({
  locationNotificationsEnabled: row.locationNotificationsEnabled === 'true',
  defaultGeofenceRadius: parseInt(row.defaultGeofenceRadius, 10) || 200,
  nearbyShopAction: row.nearbyShopAction === 'auto-open' ? 'auto-open' : 'suggest',
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
    settings: {locationNotificationsEnabled: false, defaultGeofenceRadius: 200, nearbyShopAction: 'suggest' as const, currency: '€'},
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
 * Export data as ZIP archive containing CSV + product images
 */
export const exportAndShare = async (state: AppState): Promise<boolean> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const stagingDir = `${RNFS.CachesDirectoryPath}/backup_${timestamp}`;

  try {
    // Create staging directory
    await RNFS.mkdir(stagingDir);
    const imagesStaging = `${stagingDir}/images`;
    await RNFS.mkdir(imagesStaging);

    // Copy product images to staging
    for (const product of state.products) {
      if (product.imageUri) {
        const sourcePath = product.imageUri.replace('file://', '');
        const exists = await RNFS.exists(sourcePath);
        if (exists) {
          const filename = getImageFilename(product.imageUri);
          await RNFS.copyFile(sourcePath, `${imagesStaging}/${filename}`);
        }
      }
    }

    // Write CSV data
    const csv = exportToCSV(state);
    await RNFS.writeFile(`${stagingDir}/data.csv`, csv, 'utf8');

    // Create ZIP
    const zipName = `ShopWell_Backup_${timestamp}.shopwell`;
    const zipPath = `${RNFS.CachesDirectoryPath}/${zipName}`;
    await zip(stagingDir, zipPath);

    // Share
    await Share.open({
      url: `file://${zipPath}`,
      type: 'application/zip',
      filename: zipName,
      title: 'Export ShopWell Backup',
      subject: 'ShopWell Backup',
    });

    // Cleanup staging
    await RNFS.unlink(stagingDir).catch(() => {});

    return true;
  } catch (error: any) {
    // Cleanup on error
    await RNFS.unlink(stagingDir).catch(() => {});
    if (error?.message?.includes('User did not share')) {
      return false;
    }
    console.error('Export failed:', error);
    throw error;
  }
};

/**
 * Pick a backup file and import data (supports both ZIP and legacy CSV)
 */
export const pickAndImport = async (): Promise<AppState | null> => {
  try {
    const result = await pick({
      type: [types.allFiles],
    });

    if (!result || result.length === 0) return null;

    const file = result[0];
    if (!file.uri) return null;

    // Copy to a known temporary path first
    const tempFile = `${RNFS.CachesDirectoryPath}/import_temp`;
    if (file.uri.startsWith('content://')) {
      await RNFS.copyFile(file.uri, tempFile);
    } else {
      const path = decodeURIComponent(file.uri.replace('file://', ''));
      await RNFS.copyFile(path, tempFile);
    }

    // Try to read as plain text first (legacy CSV support)
    let content: string;
    try {
      content = await RNFS.readFile(tempFile, 'utf8');
    } catch {
      content = '';
    }

    if (content.includes('[Products]') || content.includes('[Shops]')) {
      // Legacy CSV file — parse directly (no images)
      await RNFS.unlink(tempFile).catch(() => {});
      return importFromCSV(content);
    }

    // Try as ZIP archive
    const extractDir = `${RNFS.CachesDirectoryPath}/import_extract`;
    await RNFS.unlink(extractDir).catch(() => {});
    await RNFS.mkdir(extractDir);

    try {
      await unzip(tempFile, extractDir);
    } catch {
      await RNFS.unlink(tempFile).catch(() => {});
      await RNFS.unlink(extractDir).catch(() => {});
      throw new Error('Invalid backup file. Please select a ShopWell backup file (.shopwell or .csv).');
    }

    // Read CSV from archive
    const csvPath = `${extractDir}/data.csv`;
    const csvExists = await RNFS.exists(csvPath);
    if (!csvExists) {
      await RNFS.unlink(tempFile).catch(() => {});
      await RNFS.unlink(extractDir).catch(() => {});
      throw new Error('Invalid backup archive. No data.csv found inside.');
    }

    const csvContent = await RNFS.readFile(csvPath, 'utf8');
    const imported = importFromCSV(csvContent);

    // Restore images
    const imagesDir = `${extractDir}/images`;
    const imagesExist = await RNFS.exists(imagesDir);
    if (imagesExist) {
      await ensureImagesDir();
      const targetImagesDir = getImagesDir();
      const imageFiles = await RNFS.readDir(imagesDir);
      for (const imageFile of imageFiles) {
        if (imageFile.isFile()) {
          const destPath = `${targetImagesDir}/${imageFile.name}`;
          await RNFS.copyFile(imageFile.path, destPath);
        }
      }

      // Update product imageUri from filename to full internal path
      imported.products = imported.products.map(p => ({
        ...p,
        imageUri: p.imageUri ? buildImageUri(p.imageUri) : undefined,
      }));
    }

    // Cleanup
    await RNFS.unlink(tempFile).catch(() => {});
    await RNFS.unlink(extractDir).catch(() => {});

    return imported;
  } catch (error: any) {
    if (error?.message?.includes('canceled') || error?.message?.includes('cancelled')) {
      return null;
    }
    throw error;
  }
};
