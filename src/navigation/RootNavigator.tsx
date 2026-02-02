/**
 * Root Navigator for ShopWell app
 */

import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import MainTabNavigator from './MainTabNavigator';
import AddEditListScreen from '../screens/AddEditListScreen';
import AddEditShopScreen from '../screens/AddEditShopScreen';
import AddEditScheduleScreen from '../screens/AddEditScheduleScreen';
import {AddEditProductScreen} from '../screens/AddEditProductScreen';
import ListDetailScreen from '../screens/ListDetailScreen';
import ShopDetailScreen from '../screens/ShopDetailScreen';
import {ProductDetailScreen} from '../screens/ProductDetailScreen';
import {ShopModeScreen} from '../screens/ShopModeScreen';
import {useTheme} from '../context/ThemeContext';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const {colors} = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        cardStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AddEditList"
        component={AddEditListScreen}
        options={({route}) => ({
          title: route.params?.listId ? 'Edit List' : 'New List',
          presentation: 'modal',
        })}
      />
      <Stack.Screen
        name="AddEditShop"
        component={AddEditShopScreen}
        options={({route}) => ({
          title: route.params?.shopId ? 'Edit Shop' : 'New Shop',
          presentation: 'modal',
        })}
      />
      <Stack.Screen
        name="AddEditSchedule"
        component={AddEditScheduleScreen}
        options={({route}) => ({
          title: route.params?.scheduleId ? 'Edit Schedule' : 'New Schedule',
          presentation: 'modal',
        })}
      />
      <Stack.Screen
        name="AddEditProduct"
        component={AddEditProductScreen}
        options={({route}) => ({
          title: route.params?.productId ? 'Edit Product' : 'New Product',
          presentation: 'modal',
        })}
      />
      <Stack.Screen
        name="ListDetail"
        component={ListDetailScreen}
        options={{title: 'Shopping List'}}
      />
      <Stack.Screen
        name="ShopDetail"
        component={ShopDetailScreen}
        options={{title: 'Shop Details'}}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{title: 'Product Details'}}
      />
      <Stack.Screen
        name="ShopMode"
        component={ShopModeScreen}
        options={{title: 'Shop Mode', headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
