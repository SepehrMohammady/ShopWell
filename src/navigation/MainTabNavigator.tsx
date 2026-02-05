/**
 * Main Tab Navigator for ShopWell app
 */

import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainTabParamList} from '../types';
import ShopsScreen from '../screens/ShopsScreen';
import {ProductsScreen} from '../screens/ProductsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import SettingsScreen from '../screens/SettingsScreen';
import {Spacing} from '../constants';
import {useTheme} from '../context/ThemeContext';
import {View, StyleSheet, Text} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  focused: boolean;
  iconName: string;
  label: string;
  colors: any;
}

const TabIcon: React.FC<TabIconProps> = ({focused, iconName, label, colors}) => {
  return (
    <View style={styles.tabIconContainer}>
      <MaterialCommunityIcons
        name={iconName}
        size={24}
        color={focused ? colors.primary : colors.textSecondary}
      />
      <Text style={[styles.tabLabel, {color: focused ? colors.primary : colors.textSecondary}, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
};

const MainTabNavigator: React.FC = () => {
  const {colors} = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.sm,
        },
        tabBarShowLabel: false,
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
      }}>
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: 'Products',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} iconName="package-variant" label="Products" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Shops"
        component={ShopsScreen}
        options={{
          title: 'My Shops',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} iconName="store" label="Shops" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          title: 'Schedule',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} iconName="calendar-clock" label="Schedule" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} iconName="cog" label="Settings" colors={colors} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  tabLabelFocused: {
    fontWeight: '600',
  },
});

export default MainTabNavigator;
