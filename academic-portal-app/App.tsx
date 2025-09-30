import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { RoleProvider } from './src/context/RoleContext';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RoleProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </RoleProvider>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}