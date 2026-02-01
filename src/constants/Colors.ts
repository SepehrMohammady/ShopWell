/**
 * Color palette for ShopWell app
 * Flat/minimal design with clean colors
 * Supports Light and Dark mode
 */

// Light theme colors
export const LightColors = {
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
  white: '#FFFFFF',

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

// Dark theme colors
export const DarkColors = {
  // Primary colors
  primary: '#5FAEC4',
  primaryLight: '#7BB3C4',
  primaryDark: '#4A90A4',

  // Secondary colors
  secondary: '#F5A623',
  secondaryLight: '#FFD180',
  secondaryDark: '#C68400',

  // Neutral colors
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2D2D2D',

  // Text colors
  text: '#ECEFF1',
  textSecondary: '#B0BEC5',
  textLight: '#78909C',
  textInverse: '#121212',
  white: '#FFFFFF',

  // Status colors
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#EF5350',
  info: '#42A5F5',

  // Border and divider
  border: '#3D3D3D',
  divider: '#424242',

  // Special
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Category colors for shops
  grocery: '#4CAF50',
  pharmacy: '#EF5350',
  electronics: '#42A5F5',
  clothing: '#AB47BC',
  homeGoods: '#FF9800',
  other: '#78909C',
};

// Default export for backwards compatibility (will be replaced by theme context)
export const Colors = LightColors;

export const CategoryColors: {[key: string]: string} = {
  grocery: Colors.grocery,
  pharmacy: Colors.pharmacy,
  electronics: Colors.electronics,
  clothing: Colors.clothing,
  homeGoods: Colors.homeGoods,
  other: Colors.other,
};
