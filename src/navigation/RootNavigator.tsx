/**
 * Root Navigator for ShopWell app
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import MainTabNavigator from './MainTabNavigator';
import AddEditShopScreen from '../screens/AddEditShopScreen';
import AddEditScheduleScreen from '../screens/AddEditScheduleScreen';
import {AddEditProductScreen} from '../screens/AddEditProductScreen';
import ShopDetailScreen from '../screens/ShopDetailScreen';
import {ProductDetailScreen} from '../screens/ProductDetailScreen';
import {ShopModeScreen} from '../screens/ShopModeScreen';
import NearbyShopBanner from '../components/NearbyShopBanner';
import {useTheme} from '../context/ThemeContext';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const {colors} = useTheme();

  return (
    <View style={styles.root}>
      <NearbyShopBanner />
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
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default RootNavigator;
