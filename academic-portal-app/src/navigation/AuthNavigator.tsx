import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;