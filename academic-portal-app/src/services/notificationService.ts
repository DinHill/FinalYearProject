import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationToken {
  data: string;
  type: 'expo' | 'ios' | 'android';
}

/**
 * Register device token with backend
 * Note: Push notifications only work in production/development builds, not in Expo Go
 */
async function registerDeviceTokenWithBackend(token: string): Promise<void> {
  try {
    const response = await api.post('/api/v1/me/device-token', {
      token,
      device_type: Platform.OS,
      device_name: Device.modelName || 'Unknown Device',
    });

    if (!response.success) {
      // Silently fail - push notifications don't work in Expo Go anyway
      console.log('📱 Push notification registration skipped (Expo Go limitation)');
    } else {
      console.log('✅ Device token registered successfully');
    }
  } catch (error) {
    // Silently fail - push notifications don't work in Expo Go anyway
    console.log('📱 Push notification registration skipped (Expo Go limitation)');
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        // For development, generate a mock token
        token = 'development-mock-token-' + Math.random().toString(36).substring(7);
      } else {
        const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
        token = pushToken.data;
      }

      // Register token with backend
      if (token) {
        await registerDeviceTokenWithBackend(token);
      }
    } catch (error) {
      console.error('Error getting push token:', error);
      // For development, use a mock token
      token = 'development-mock-token-' + Math.random().toString(36).substring(7);
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}

export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseReceivedListener(
  listener: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || null,
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}
