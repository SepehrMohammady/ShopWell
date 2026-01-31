/**
 * ShopWell App
 * A shopping list and shop management app
 * Version: 0.0.1
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {AppProvider} from './context/AppContext';
import RootNavigator from './navigation/RootNavigator';
import {Colors} from './constants/Colors';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={Colors.background}
          />
          <RootNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
};

export default App;
