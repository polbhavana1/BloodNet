/**
 * BloodNet+ React Native Mobile App
 * Cross-platform mobile application for blood donation management
 */

import React, { useState, useEffect } from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  SafeAreaProvider,
  SafeAreaView,
  StatusBar,
  Appearance,
  LogBox,
} from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/store';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { LocationProvider } from './src/context/LocationContext';
import SplashScreen from './src/screens/SplashScreen';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import NotificationService from './src/services/NotificationService';
import LocationService from './src/services/LocationService';
import { colors } from './src/theme/colors';

// Ignore specific warnings
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'Setting a timer',
]);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom navigation theme
const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.onSurface,
    border: colors.outline,
    primary: colors.primary,
    notification: colors.error,
  },
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { theme, isDark } = useTheme();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize services
      await NotificationService.initialize();
      await LocationService.initialize();

      // Check authentication status
      const userToken = await store.getState().auth.token;
      setIsAuthenticated(!!userToken);

      // Set status bar style based on theme
      StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');

      // Simulate splash screen
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('App initialization error:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider>
              <LocationProvider>
                <NotificationProvider>
                  <PaperProvider theme={theme}>
                    <NavigationContainer theme={navigationTheme}>
                      <StatusBar
                        backgroundColor={colors.surface}
                        barStyle={isDark ? 'light-content' : 'dark-content'}
                        translucent={false}
                      />
                      <SafeAreaView style={{ flex: 1 }}>
                        {isAuthenticated ? (
                          <MainNavigator />
                        ) : (
                          <AuthNavigator />
                        )}
                      </SafeAreaView>
                    </NavigationContainer>
                  </PaperProvider>
                </NotificationProvider>
              </LocationProvider>
            </ThemeProvider>
          </PersistGate>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
