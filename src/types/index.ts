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
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
}

// Unit types for quantity measurement
export type UnitType = 'pcs' | 'g' | 'kg' | 'ml' | 'L' | 'cm' | 'm';

export const UnitLabels: Record<UnitType, string> = {
  pcs: 'pieces',
  g: 'grams',
  kg: 'kilograms',
  ml: 'milliliters',
  L: 'liters',
  cm: 'centimeters',
  m: 'meters',
};

// Shop-Product-Brand relationship with price
// A product can have multiple brands at each shop, each with its own price
export interface ShopProductBrand {
  id: string;
  productId: string;
  shopId: string;
  brand: string;
  price: number;
  currency: string;
  quantity?: number;
  unit?: UnitType;
  url?: string;
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

// Shop Category
// Taxonomy synthesized from reliable retail standards: Google Places API place
// types, OpenStreetMap Key:shop, NAICS 2022 (sectors 44-45), and mainstream
// marketplace departments (Amazon / Yelp / Google Shopping).
export type ShopCategory =
  | 'grocery'
  | 'convenience'
  | 'pharmacy'
  | 'beauty'
  | 'clothing'
  | 'jewelry'
  | 'electronics'
  | 'homeGoods'
  | 'furniture'
  | 'hardware'
  | 'garden'
  | 'beverages'
  | 'sports'
  | 'toys'
  | 'books'
  | 'pets'
  | 'babyKids'
  | 'automotive'
  | 'department'
  | 'thrift'
  | 'other';

// Shop address/branch with location
export interface ShopAddress {
  id: string;
  label?: string; // e.g. "Main Branch", "Downtown"
  address?: string;
  latitude?: number;
  longitude?: number;
  geofenceRadius?: number; // meters, default 200
  notifyOnNearby?: boolean;
}

// Shop
export interface Shop {
  id: string;
  name: string;
  address?: string; // Primary address (backward compat)
  category: ShopCategory;
  notes?: string;
  isFavorite: boolean;
  isOnline?: boolean;
  url?: string;
  // Location fields for primary address (backward compat)
  latitude?: number;
  longitude?: number;
  geofenceRadius?: number; // meters, default 200
  notifyOnNearby?: boolean;
  // Multiple addresses/branches
  addresses?: ShopAddress[];
  createdAt: string;
  updatedAt: string;
}

// Schedule
export interface Schedule {
  id: string;
  title: string;
  shopId?: string;
  productIds?: string[];
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
  nearbyShopAction: 'suggest' | 'auto-open'; // What to do when near a shop
  currency: string;
  currencies: string[]; // User's available currencies
}

// App State
export interface AppState {
  shoppingLists: any[]; // kept for backward compatibility
  shops: Shop[];
  schedules: Schedule[];
  products: Product[];
  shopProductBrands: ShopProductBrand[];
  settings: AppSettings;
}

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  AddEditShop: {shopId?: string};
  AddEditSchedule: {scheduleId?: string};
  AddEditProduct: {productId?: string};
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

// Shop category display info (single source of truth for label, icon and color).
// Icons are MaterialCommunityIcons glyph names; ordered everyday -> specialized.
export const ShopCategoryInfo: Record<ShopCategory, {label: string; icon: string; color: string}> = {
  grocery: {label: 'Grocery', icon: 'cart', color: '#43A047'},
  convenience: {label: 'Convenience', icon: 'store-24-hour', color: '#00ACC1'},
  pharmacy: {label: 'Pharmacy & Health', icon: 'pill', color: '#E53935'},
  beauty: {label: 'Beauty', icon: 'lipstick', color: '#EC407A'},
  clothing: {label: 'Clothing & Shoes', icon: 'tshirt-crew', color: '#8E24AA'},
  jewelry: {label: 'Jewelry & Watches', icon: 'diamond-stone', color: '#5E35B1'},
  electronics: {label: 'Electronics', icon: 'cellphone', color: '#1E88E5'},
  homeGoods: {label: 'Home Goods', icon: 'home', color: '#FB8C00'},
  furniture: {label: 'Furniture', icon: 'sofa', color: '#8D6E63'},
  hardware: {label: 'Hardware & DIY', icon: 'hammer-wrench', color: '#546E7A'},
  garden: {label: 'Garden & Florist', icon: 'flower', color: '#7CB342'},
  beverages: {label: 'Drinks & Liquor', icon: 'bottle-wine', color: '#AD1457'},
  sports: {label: 'Sports & Outdoors', icon: 'basketball', color: '#F4511E'},
  toys: {label: 'Toys & Hobbies', icon: 'teddy-bear', color: '#FBC02D'},
  books: {label: 'Books & Stationery', icon: 'book-open-variant', color: '#3949AB'},
  pets: {label: 'Pet Supplies', icon: 'paw', color: '#00897B'},
  babyKids: {label: 'Baby & Kids', icon: 'baby-carriage', color: '#FF8A65'},
  automotive: {label: 'Automotive', icon: 'car', color: '#455A64'},
  department: {label: 'Department & Discount', icon: 'storefront', color: '#5C6BC0'},
  thrift: {label: 'Thrift & Secondhand', icon: 'recycle', color: '#9E9D24'},
  other: {label: 'Other', icon: 'store', color: '#90A4AE'},
};

// Product category display info
export const ProductCategoryInfo: Record<ProductCategory, {label: string; icon: string; color: string}> = {
  personalCare: {label: 'Personal Care', icon: 'face-woman-shimmer', color: '#E91E63'},
  healthWellness: {label: 'Health & Wellness', icon: 'pill', color: '#4CAF50'},
  household: {label: 'Household', icon: 'home', color: '#FF9800'},
  beverages: {label: 'Beverages', icon: 'cup-water', color: '#2196F3'},
  food: {label: 'Food', icon: 'food-apple', color: '#8BC34A'},
  other: {label: 'Other', icon: 'package-variant', color: '#607D8B'},
};

// Predefined currencies
export const PREDEFINED_CURRENCIES = [
  '€', '$', '£', '¥', '₹', '₽', '₩', '₺', '₫', '฿', 'zł', 'kr', 'R$', 'CHF', 'A$', 'C$',
];

// Default app settings
export const defaultSettings: AppSettings = {
  locationNotificationsEnabled: false,
  nearbyShopAction: 'suggest',
  currency: '€',
  currencies: ['€', '$', '£', '¥', '₹'],
};
