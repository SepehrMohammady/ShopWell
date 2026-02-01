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
import {Spacing} from '../constants';
import {useTheme} from '../context/ThemeContext';
import {View, StyleSheet, Text} from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  focused: boolean;
  icon: string;
  label: string;
  colors: any;
}

const TabIcon: React.FC<TabIconProps> = ({focused, icon, label, colors}) => {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icon}
      </Text>
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
        name="ShoppingLists"
        component={ShoppingListsScreen}
        options={{
          title: 'Shopping Lists',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="📝" label="Lists" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Shops"
        component={ShopsScreen}
        options={{
          title: 'My Shops',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="🏪" label="Shops" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          title: 'Schedule',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="📅" label="Schedule" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="⚙️" label="Settings" colors={colors} />
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
    marginTop: 2,
  },
  tabLabelFocused: {
    fontWeight: '600',
  },
});

export default MainTabNavigator;
