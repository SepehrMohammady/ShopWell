/**
 * App Context for global state management
 */

import React, {createContext, useContext, useReducer, useEffect} from 'react';
import {ShoppingList, Shop, Schedule, AppState} from '../types';
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
  | {type: 'DELETE_SCHEDULE'; payload: string};

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
}

const initialState: AppState = {
  shoppingLists: [],
  shops: [],
  schedules: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;

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

  const addList = (list: ShoppingList) => {
    dispatch({type: 'ADD_LIST', payload: list});
  };

  const updateList = (list: ShoppingList) => {
    dispatch({type: 'UPDATE_LIST', payload: list});
  };

  const deleteList = (id: string) => {
    dispatch({type: 'DELETE_LIST', payload: id});
  };

  const addShop = (shop: Shop) => {
    dispatch({type: 'ADD_SHOP', payload: shop});
  };

  const updateShop = (shop: Shop) => {
    dispatch({type: 'UPDATE_SHOP', payload: shop});
  };

  const deleteShop = (id: string) => {
    dispatch({type: 'DELETE_SHOP', payload: id});
  };

  const addSchedule = (schedule: Schedule) => {
    dispatch({type: 'ADD_SCHEDULE', payload: schedule});
  };

  const updateSchedule = (schedule: Schedule) => {
    dispatch({type: 'UPDATE_SCHEDULE', payload: schedule});
  };

  const deleteSchedule = (id: string) => {
    dispatch({type: 'DELETE_SCHEDULE', payload: id});
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
