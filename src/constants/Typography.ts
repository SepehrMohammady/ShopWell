/**
 * Typography constants for ShopWell app
 * Flat/minimal design typography
 */

import {Platform} from 'react-native';

export const FontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    windows: 'Segoe UI',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    windows: 'Segoe UI Semibold',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    windows: 'Segoe UI Bold',
  }),
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};
