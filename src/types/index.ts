/**
 * Type definitions for ShopWell app
 */

// Product Category
export type ProductCategory =
  | 'personalCare'
  | 'healthWellness'
  | 'household'
  | 'beverages'
  | 'food'
  | 'other';

// Product - Master product definition
export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  isAvailable: boolean; // true = we have it, false = on shopping list
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Shop-Product-Brand relationship with price
// A product can have multiple brands at each shop, each with its own price
export interface ShopProductBrand {
  id: string;
  productId: string;
  shopId: string;
  brand: string;
  price: number;
  currency: string;
  lastUpdated: string;
}

// Price comparison result
export interface PriceComparison {
  currentPrice: number;
  cheapestPrice: number;
  cheapestShopId: string;
  cheapestShopName: string;
  savings: number;
  savingsPercent: number;
  isCheapest: boolean;
}

// Shopping Item
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  isCompleted: boolean;
  shopId?: string;
  productId?: string; // Link to Product for price lookup
  category?: ProductCategory;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Shopping List
export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  shopId?: string;
  scheduledDate?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Shop Category
export type ShopCategory =
  | 'grocery'
  | 'pharmacy'
  | 'electronics'
  | 'clothing'
  | 'homeGoods'
  | 'other';

// Shop
export interface Shop {
  id: string;
  name: string;
  address?: string;
  category: ShopCategory;
  notes?: string;
  isFavorite: boolean;
  // Location fields for geofencing
  latitude?: number;
  longitude?: number;
  geofenceRadius?: number; // meters, default 200
  notifyOnNearby?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Schedule
export interface Schedule {
  id: string;
  title: string;
  shopId?: string;
  listId?: string;
  date: string;
  time?: string;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  reminder: boolean;
  reminderMinutes?: number;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// App Settings
export interface AppSettings {
  locationNotificationsEnabled: boolean;
  defaultGeofenceRadius: number; // meters
  currency: string;
}

// App State
export interface AppState {
  shoppingLists: ShoppingList[];
  shops: Shop[];
  schedules: Schedule[];
  products: Product[];
  shopProductBrands: ShopProductBrand[];
  settings: AppSettings;
}

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  AddEditList: {listId?: string};
  AddEditShop: {shopId?: string};
  AddEditSchedule: {scheduleId?: string};
  AddEditProduct: {productId?: string};
  ListDetail: {listId: string};
  ShopDetail: {shopId: string};
  ProductDetail: {productId: string};
  ShopMode: {shopId: string};
};

export type MainTabParamList = {
  Products: undefined;
  Shops: undefined;
  Schedule: undefined;
  Settings: undefined;
};

// Product category display info
export const ProductCategoryInfo: Record<ProductCategory, {label: string; icon: string; color: string}> = {
  personalCare: {label: 'Personal Care', icon: '🧼', color: '#E91E63'},
  healthWellness: {label: 'Health & Wellness', icon: '💊', color: '#4CAF50'},
  household: {label: 'Household', icon: '🏠', color: '#FF9800'},
  beverages: {label: 'Beverages', icon: '🧃', color: '#2196F3'},
  food: {label: 'Food', icon: '🍞', color: '#8BC34A'},
  other: {label: 'Other', icon: '📦', color: '#607D8B'},
};

// Default app settings
export const defaultSettings: AppSettings = {
  locationNotificationsEnabled: false,
  defaultGeofenceRadius: 200,
  currency: '€',
};
