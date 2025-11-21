import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { RoleProvider } from './src/context/RoleContext';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, addNotificationReceivedListener, addNotificationResponseReceivedListener } from './src/services/notificationService';

export default function App() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const navigationRef = useRef<any>();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('Push notification token:', token);
      }
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for user interactions with notifications (taps)
    responseListener.current = addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      handleNotificationNavigation(response.notification);
    });

    return () => {
      // Clean up notification listeners
      try {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      } catch (error) {
        // Ignore cleanup errors in Expo Go
        console.log('Notification cleanup skipped (Expo Go limitation)');
      }
    };
  }, []);

  const handleNotificationNavigation = (notification: Notifications.Notification) => {
    const data = notification.request.content.data;
    const type = data?.type;

    if (!navigationRef.current) return;

    // Navigate based on notification type
    setTimeout(() => {
      try {
        switch (type) {
          case 'grade_update':
            navigationRef.current?.navigate('Academic', { screen: 'Grades' });
            break;
          case 'schedule_change':
            navigationRef.current?.navigate('Schedule');
            break;
          case 'document_ready':
            navigationRef.current?.navigate('More', { screen: 'Documents' });
            break;
          case 'payment_reminder':
            navigationRef.current?.navigate('More', { screen: 'Finance' });
            break;
          case 'announcement':
            navigationRef.current?.navigate('More', { screen: 'Announcements' });
            break;
          default:
            navigationRef.current?.navigate('More', { screen: 'Notifications' });
        }
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }, 100);
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <AuthProvider>
          <RoleProvider>
            <AppNavigator />
          </RoleProvider>
        </AuthProvider>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}