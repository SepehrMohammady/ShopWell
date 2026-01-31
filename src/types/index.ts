/**
 * Type definitions for ShopWell app
 */

// Shopping Item
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  isCompleted: boolean;
  shopId?: string;
  category?: string;
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

// App State
export interface AppState {
  shoppingLists: ShoppingList[];
  shops: Shop[];
  schedules: Schedule[];
}

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  AddEditList: {listId?: string};
  AddEditShop: {shopId?: string};
  AddEditSchedule: {scheduleId?: string};
  ListDetail: {listId: string};
  ShopDetail: {shopId: string};
};

export type MainTabParamList = {
  ShoppingLists: undefined;
  Shops: undefined;
  Schedule: undefined;
  Settings: undefined;
};
