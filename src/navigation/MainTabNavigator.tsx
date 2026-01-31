/**
 * Main Tab Navigator for ShopWell app
 */

import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainTabParamList} from '../types';
import ShoppingListsScreen from '../screens/ShoppingListsScreen';
import ShopsScreen from '../screens/ShopsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import SettingsScreen from '../screens/SettingsScreen';
import {Colors, Spacing} from '../constants';
import {View, StyleSheet, Text} from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  focused: boolean;
  icon: string;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({focused, icon, label}) => {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icon}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
};

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.sm,
        },
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: Colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}>
      <Tab.Screen
        name="ShoppingLists"
        component={ShoppingListsScreen}
        options={{
          title: 'Shopping Lists',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="📝" label="Lists" />
          ),
        }}
      />
      <Tab.Screen
        name="Shops"
        component={ShopsScreen}
        options={{
          title: 'My Shops',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="🏪" label="Shops" />
          ),
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          title: 'Schedule',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="📅" label="Schedule" />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="⚙️" label="Settings" />
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
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tabLabelFocused: {
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default MainTabNavigator;
