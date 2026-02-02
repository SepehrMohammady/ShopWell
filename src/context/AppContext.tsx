/**
 * App Context for global state management
 */

import React, {createContext, useContext, useReducer, useEffect} from 'react';
import {
  ShoppingList,
  Shop,
  Schedule,
  Product,
  ShopProduct,
  AppState,
  AppSettings,
  defaultSettings,
} from '../types';
import {StorageService} from '../services/StorageService';

// Action types
type Action =
  | {type: 'SET_STATE'; payload: AppState}
  | {type: 'ADD_LIST'; payload: ShoppingList}
  | {type: 'UPDATE_LIST'; payload: ShoppingList}
  | {type: 'DELETE_LIST'; payload: string}
  | {type: 'ADD_SHOP'; payload: Shop}
  | {type: 'UPDATE_SHOP'; payload: Shop}
  | {type: 'DELETE_SHOP'; payload: string}
  | {type: 'ADD_SCHEDULE'; payload: Schedule}
  | {type: 'UPDATE_SCHEDULE'; payload: Schedule}
  | {type: 'DELETE_SCHEDULE'; payload: string}
  | {type: 'ADD_PRODUCT'; payload: Product}
  | {type: 'UPDATE_PRODUCT'; payload: Product}
  | {type: 'DELETE_PRODUCT'; payload: string}
  | {type: 'ADD_SHOP_PRODUCT'; payload: ShopProduct}
  | {type: 'UPDATE_SHOP_PRODUCT'; payload: ShopProduct}
  | {type: 'DELETE_SHOP_PRODUCT'; payload: string}
  | {type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings>};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Shopping Lists
  addList: (list: ShoppingList) => void;
  updateList: (list: ShoppingList) => void;
  deleteList: (id: string) => void;
  // Shops
  addShop: (shop: Shop) => void;
  updateShop: (shop: Shop) => void;
  deleteShop: (id: string) => void;
  // Schedules
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (schedule: Schedule) => void;
  deleteSchedule: (id: string) => void;
  // Products
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  // Shop Products (prices)
  addShopProduct: (shopProduct: ShopProduct) => void;
  updateShopProduct: (shopProduct: ShopProduct) => void;
  deleteShopProduct: (id: string) => void;
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  // Helpers
  getProductsForShop: (shopId: string) => Array<{product: Product; shopProduct: ShopProduct}>;
  getShopsForProduct: (productId: string) => Array<{shop: Shop; shopProduct: ShopProduct}>;
  getShopProduct: (productId: string, shopId: string) => ShopProduct | undefined;
}

const initialState: AppState = {
  shoppingLists: [],
  shops: [],
  schedules: [],
  products: [],
  shopProducts: [],
  settings: defaultSettings,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return {
        ...initialState,
        ...action.payload,
        settings: {...defaultSettings, ...action.payload.settings},
      };

    case 'ADD_LIST':
      return {
        ...state,
        shoppingLists: [...state.shoppingLists, action.payload],
      };

    case 'UPDATE_LIST':
      return {
        ...state,
        shoppingLists: state.shoppingLists.map(list =>
          list.id === action.payload.id ? action.payload : list,
        ),
      };

    case 'DELETE_LIST':
      return {
        ...state,
        shoppingLists: state.shoppingLists.filter(
          list => list.id !== action.payload,
        ),
      };

    case 'ADD_SHOP':
      return {
        ...state,
        shops: [...state.shops, action.payload],
      };

    case 'UPDATE_SHOP':
      return {
        ...state,
        shops: state.shops.map(shop =>
          shop.id === action.payload.id ? action.payload : shop,
        ),
      };

    case 'DELETE_SHOP':
      return {
        ...state,
        shops: state.shops.filter(shop => shop.id !== action.payload),
        // Also remove shop products for this shop
        shopProducts: state.shopProducts.filter(sp => sp.shopId !== action.payload),
      };

    case 'ADD_SCHEDULE':
      return {
        ...state,
        schedules: [...state.schedules, action.payload],
      };

    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.map(schedule =>
          schedule.id === action.payload.id ? action.payload : schedule,
        ),
      };

    case 'DELETE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.filter(
          schedule => schedule.id !== action.payload,
        ),
      };

    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload],
      };

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id ? action.payload : product,
        ),
      };

    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(product => product.id !== action.payload),
        // Also remove shop products for this product
        shopProducts: state.shopProducts.filter(sp => sp.productId !== action.payload),
      };

    case 'ADD_SHOP_PRODUCT':
      return {
        ...state,
        shopProducts: [...state.shopProducts, action.payload],
      };

    case 'UPDATE_SHOP_PRODUCT':
      return {
        ...state,
        shopProducts: state.shopProducts.map(sp =>
          sp.id === action.payload.id ? action.payload : sp,
        ),
      };

    case 'DELETE_SHOP_PRODUCT':
      return {
        ...state,
        shopProducts: state.shopProducts.filter(sp => sp.id !== action.payload),
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {...state.settings, ...action.payload},
      };

    default:
      return state;
  }
}

export const AppProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const savedState = await StorageService.loadAppState();
      if (savedState) {
        dispatch({type: 'SET_STATE', payload: savedState});
      }
    };
    loadData();
  }, []);

  // Save data on state change
  useEffect(() => {
    StorageService.saveAppState(state);
  }, [state]);

  // Shopping Lists
  const addList = (list: ShoppingList) => {
    dispatch({type: 'ADD_LIST', payload: list});
  };

  const updateList = (list: ShoppingList) => {
    dispatch({type: 'UPDATE_LIST', payload: list});
  };

  const deleteList = (id: string) => {
    dispatch({type: 'DELETE_LIST', payload: id});
  };

  // Shops
  const addShop = (shop: Shop) => {
    dispatch({type: 'ADD_SHOP', payload: shop});
  };

  const updateShop = (shop: Shop) => {
    dispatch({type: 'UPDATE_SHOP', payload: shop});
  };

  const deleteShop = (id: string) => {
    dispatch({type: 'DELETE_SHOP', payload: id});
  };

  // Schedules
  const addSchedule = (schedule: Schedule) => {
    dispatch({type: 'ADD_SCHEDULE', payload: schedule});
  };

  const updateSchedule = (schedule: Schedule) => {
    dispatch({type: 'UPDATE_SCHEDULE', payload: schedule});
  };

  const deleteSchedule = (id: string) => {
    dispatch({type: 'DELETE_SCHEDULE', payload: id});
  };

  // Products
  const addProduct = (product: Product) => {
    dispatch({type: 'ADD_PRODUCT', payload: product});
  };

  const updateProduct = (product: Product) => {
    dispatch({type: 'UPDATE_PRODUCT', payload: product});
  };

  const deleteProduct = (id: string) => {
    dispatch({type: 'DELETE_PRODUCT', payload: id});
  };

  // Shop Products
  const addShopProduct = (shopProduct: ShopProduct) => {
    dispatch({type: 'ADD_SHOP_PRODUCT', payload: shopProduct});
  };

  const updateShopProduct = (shopProduct: ShopProduct) => {
    dispatch({type: 'UPDATE_SHOP_PRODUCT', payload: shopProduct});
  };

  const deleteShopProduct = (id: string) => {
    dispatch({type: 'DELETE_SHOP_PRODUCT', payload: id});
  };

  // Settings
  const updateSettings = (settings: Partial<AppSettings>) => {
    dispatch({type: 'UPDATE_SETTINGS', payload: settings});
  };

  // Helper: Get all products available at a shop with their prices
  const getProductsForShop = (shopId: string) => {
    return state.shopProducts
      .filter(sp => sp.shopId === shopId)
      .map(sp => {
        const product = state.products.find(p => p.id === sp.productId);
        return product ? {product, shopProduct: sp} : null;
      })
      .filter((item): item is {product: Product; shopProduct: ShopProduct} => item !== null);
  };

  // Helper: Get all shops that carry a product with their prices
  const getShopsForProduct = (productId: string) => {
    return state.shopProducts
      .filter(sp => sp.productId === productId)
      .map(sp => {
        const shop = state.shops.find(s => s.id === sp.shopId);
        return shop ? {shop, shopProduct: sp} : null;
      })
      .filter((item): item is {shop: Shop; shopProduct: ShopProduct} => item !== null);
  };

  // Helper: Get specific shop-product relationship
  const getShopProduct = (productId: string, shopId: string) => {
    return state.shopProducts.find(
      sp => sp.productId === productId && sp.shopId === shopId,
    );
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        addList,
        updateList,
        deleteList,
        addShop,
        updateShop,
        deleteShop,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        addProduct,
        updateProduct,
        deleteProduct,
        addShopProduct,
        updateShopProduct,
        deleteShopProduct,
        updateSettings,
        getProductsForShop,
        getShopsForProduct,
        getShopProduct,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
