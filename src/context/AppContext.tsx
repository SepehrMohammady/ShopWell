/**
 * App Context for global state management
 */

import React, {createContext, useContext, useReducer, useEffect} from 'react';
import {
  ShoppingList,
  Shop,
  Schedule,
  Product,
  ShopProductBrand,
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
  | {type: 'ADD_SHOP_PRODUCT_BRAND'; payload: ShopProductBrand}
  | {type: 'UPDATE_SHOP_PRODUCT_BRAND'; payload: ShopProductBrand}
  | {type: 'DELETE_SHOP_PRODUCT_BRAND'; payload: string}
  | {type: 'DELETE_SHOP_PRODUCT_BRANDS_FOR_PRODUCT'; payload: string}
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
  toggleProductAvailability: (id: string) => void;
  // Shop Product Brands (prices per brand at each shop)
  addShopProductBrand: (spb: ShopProductBrand) => void;
  updateShopProductBrand: (spb: ShopProductBrand) => void;
  deleteShopProductBrand: (id: string) => void;
  deleteShopProductBrandsForProduct: (productId: string) => void;
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  // Helpers
  getProductsForShop: (shopId: string) => Array<{product: Product; brands: ShopProductBrand[]}>;
  getBrandsForProductAtShop: (productId: string, shopId: string) => ShopProductBrand[];
  getShopsForProduct: (productId: string) => Array<{shop: Shop; brands: ShopProductBrand[]}>;
  getShoppingList: () => Product[]; // Products where isAvailable = false
  getAvailableProducts: () => Product[]; // Products where isAvailable = true
}

const initialState: AppState = {
  shoppingLists: [],
  shops: [],
  schedules: [],
  products: [],
  shopProductBrands: [],
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
        // Also remove shop product brands for this shop
        shopProductBrands: state.shopProductBrands.filter(spb => spb.shopId !== action.payload),
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
        // Also remove shop product brands for this product
        shopProductBrands: state.shopProductBrands.filter(spb => spb.productId !== action.payload),
      };

    case 'ADD_SHOP_PRODUCT_BRAND':
      return {
        ...state,
        shopProductBrands: [...state.shopProductBrands, action.payload],
      };

    case 'UPDATE_SHOP_PRODUCT_BRAND':
      return {
        ...state,
        shopProductBrands: state.shopProductBrands.map(spb =>
          spb.id === action.payload.id ? action.payload : spb,
        ),
      };

    case 'DELETE_SHOP_PRODUCT_BRAND':
      return {
        ...state,
        shopProductBrands: state.shopProductBrands.filter(spb => spb.id !== action.payload),
      };

    case 'DELETE_SHOP_PRODUCT_BRANDS_FOR_PRODUCT':
      return {
        ...state,
        shopProductBrands: state.shopProductBrands.filter(spb => spb.productId !== action.payload),
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

  const toggleProductAvailability = (id: string) => {
    const product = state.products.find(p => p.id === id);
    if (product) {
      dispatch({
        type: 'UPDATE_PRODUCT',
        payload: {
          ...product,
          isAvailable: !product.isAvailable,
          updatedAt: new Date().toISOString(),
        },
      });
    }
  };

  // Shop Product Brands
  const addShopProductBrand = (spb: ShopProductBrand) => {
    dispatch({type: 'ADD_SHOP_PRODUCT_BRAND', payload: spb});
  };

  const updateShopProductBrand = (spb: ShopProductBrand) => {
    dispatch({type: 'UPDATE_SHOP_PRODUCT_BRAND', payload: spb});
  };

  const deleteShopProductBrand = (id: string) => {
    dispatch({type: 'DELETE_SHOP_PRODUCT_BRAND', payload: id});
  };

  const deleteShopProductBrandsForProduct = (productId: string) => {
    dispatch({type: 'DELETE_SHOP_PRODUCT_BRANDS_FOR_PRODUCT', payload: productId});
  };

  // Settings
  const updateSettings = (settings: Partial<AppSettings>) => {
    dispatch({type: 'UPDATE_SETTINGS', payload: settings});
  };

  // Helper: Get all products available at a shop with their brand/price options
  const getProductsForShop = (shopId: string) => {
    const productIds = [...new Set(
      state.shopProductBrands
        .filter(spb => spb.shopId === shopId)
        .map(spb => spb.productId)
    )];
    
    return productIds
      .map(productId => {
        const product = state.products.find(p => p.id === productId);
        const brands = state.shopProductBrands.filter(
          spb => spb.productId === productId && spb.shopId === shopId
        );
        return product ? {product, brands} : null;
      })
      .filter((item): item is {product: Product; brands: ShopProductBrand[]} => item !== null);
  };

  // Helper: Get all brands/prices for a product at a specific shop
  const getBrandsForProductAtShop = (productId: string, shopId: string) => {
    return state.shopProductBrands.filter(
      spb => spb.productId === productId && spb.shopId === shopId
    );
  };

  // Helper: Get all shops that carry a product with their brand/price options
  const getShopsForProduct = (productId: string) => {
    const shopIds = [...new Set(
      state.shopProductBrands
        .filter(spb => spb.productId === productId)
        .map(spb => spb.shopId)
    )];
    
    return shopIds
      .map(shopId => {
        const shop = state.shops.find(s => s.id === shopId);
        const brands = state.shopProductBrands.filter(
          spb => spb.productId === productId && spb.shopId === shopId
        );
        return shop ? {shop, brands} : null;
      })
      .filter((item): item is {shop: Shop; brands: ShopProductBrand[]} => item !== null);
  };

  // Helper: Get products that need to be bought (shopping list)
  const getShoppingList = () => {
    return state.products.filter(p => !p.isAvailable);
  };

  // Helper: Get products that are available (we have them)
  const getAvailableProducts = () => {
    return state.products.filter(p => p.isAvailable);
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
        toggleProductAvailability,
        addShopProductBrand,
        updateShopProductBrand,
        deleteShopProductBrand,
        deleteShopProductBrandsForProduct,
        updateSettings,
        getProductsForShop,
        getBrandsForProductAtShop,
        getShopsForProduct,
        getShoppingList,
        getAvailableProducts,
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
