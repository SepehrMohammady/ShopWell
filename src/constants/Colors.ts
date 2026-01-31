/**
 * Color palette for ShopWell app
 * Flat/minimal design with clean colors
 */

export const Colors = {
  // Primary colors
  primary: '#4A90A4',
  primaryLight: '#7BB3C4',
  primaryDark: '#2D6A7C',

  // Secondary colors
  secondary: '#F5A623',
  secondaryLight: '#FFD180',
  secondaryDark: '#C68400',

  // Neutral colors
  background: '#FAFBFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  // Text colors
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  textLight: '#BDC3C7',
  textInverse: '#FFFFFF',

  // Status colors
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',

  // Border and divider
  border: '#ECF0F1',
  divider: '#E8E8E8',

  // Special
  shadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Category colors for shops
  grocery: '#27AE60',
  pharmacy: '#E74C3C',
  electronics: '#3498DB',
  clothing: '#9B59B6',
  homeGoods: '#E67E22',
  other: '#95A5A6',
};

export const CategoryColors: {[key: string]: string} = {
  grocery: Colors.grocery,
  pharmacy: Colors.pharmacy,
  electronics: Colors.electronics,
  clothing: Colors.clothing,
  homeGoods: Colors.homeGoods,
  other: Colors.other,
};
