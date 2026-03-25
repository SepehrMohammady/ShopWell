/**
 * Image Service - Copies product images to persistent internal storage
 * Ensures images survive app cache clears and can be included in backups
 */

import RNFS from 'react-native-fs';
import {generateId} from '../utils/helpers';

const IMAGES_DIR = `${RNFS.DocumentDirectoryPath}/product-images`;

/**
 * Ensure the images directory exists
 */
const ensureDir = async (): Promise<void> => {
  const exists = await RNFS.exists(IMAGES_DIR);
  if (!exists) {
    await RNFS.mkdir(IMAGES_DIR);
  }
};

/**
 * Save an image from a picker URI to internal storage
 * Returns the internal file path (file:// URI)
 */
export const saveProductImage = async (sourceUri: string): Promise<string> => {
  await ensureDir();

  // If already in our internal directory, return as-is
  if (sourceUri.includes('/product-images/')) {
    return sourceUri;
  }

  const ext = sourceUri.match(/\.\w+$/)?.[0] || '.jpg';
  const filename = `${generateId()}${ext}`;
  const destPath = `${IMAGES_DIR}/${filename}`;

  await RNFS.copyFile(sourceUri, destPath);
  return `file://${destPath}`;
};

/**
 * Delete a product image from internal storage
 */
export const deleteProductImage = async (imageUri: string): Promise<void> => {
  if (!imageUri || !imageUri.includes('/product-images/')) return;
  const path = imageUri.replace('file://', '');
  const exists = await RNFS.exists(path);
  if (exists) {
    await RNFS.unlink(path);
  }
};

/**
 * Get the internal images directory path
 */
export const getImagesDir = (): string => IMAGES_DIR;

/**
 * Get just the filename from an internal image URI
 */
export const getImageFilename = (imageUri: string): string => {
  const parts = imageUri.split('/');
  return parts[parts.length - 1];
};

/**
 * Build the full internal URI from a filename
 */
export const buildImageUri = (filename: string): string => {
  return `file://${IMAGES_DIR}/${filename}`;
};

/**
 * Ensure the images directory exists (for restore)
 */
export const ensureImagesDir = ensureDir;
