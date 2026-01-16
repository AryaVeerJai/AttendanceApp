// ============================================================================
// REACT NATIVE: services/notificationService.js
// ============================================================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import Constants from 'expo-constants';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ============================================================================
// Register for Push Notifications
// ============================================================================
export const registerForPushNotifications = async () => {
  try {
    // Check if running on physical device
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return null;
    }

    // Get Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id',
    });

    const expoPushToken = tokenData.data;

    // Get device information
    const deviceId = await getDeviceId();
    const deviceInfo = {
      deviceId,
      deviceName: Device.deviceName || 'Unknown Device',
      deviceType: Platform.OS,
      expoPushToken,
    };

    // Save token locally
    await AsyncStorage.setItem('expoPushToken', expoPushToken);

    // Register token with backend
    await registerTokenWithBackend(deviceInfo);

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    console.log('Push notification registered:', expoPushToken);
    return expoPushToken;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

// ============================================================================
// Register Token with Backend
// ============================================================================
const registerTokenWithBackend = async (deviceInfo) => {
  try {
    const response = await api.post('/notifications/register-token', deviceInfo);
    
    if (response.data.status === 'success') {
      console.log('Push token registered with backend');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error registering token with backend:', error);
    return false;
  }
};

// ============================================================================
// Get Device ID
// ============================================================================
const getDeviceId = async () => {
  try {
    let deviceId = await AsyncStorage.getItem('deviceId');
    
    if (!deviceId) {
      deviceId = `${Device.modelName || 'device'}-${Device.osInternalBuildId || Date.now()}`;
      await AsyncStorage.setItem('deviceId', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return `fallback-${Date.now()}`;
  }
};

// ============================================================================
// Schedule Local Notification
// ============================================================================
export const scheduleLocalNotification = async ({ title, body, data = {}, trigger = null }) => {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger || null, // null = immediate
    });

    console.log('Local notification scheduled:', id);
    return id;
  } catch (error) {
    console.error('Error scheduling local notification:', error);
    return null;
  }
};

// ============================================================================
// Cancel Scheduled Notification
// ============================================================================
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('Notification cancelled:', notificationId);
    return true;
  } catch (error) {
    console.error('Error cancelling notification:', error);
    return false;
  }
};

// ============================================================================
// Cancel All Scheduled Notifications
// ============================================================================
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
    return true;
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
    return false;
  }
};

// ============================================================================
// Get Badge Count
// ============================================================================
export const getBadgeCount = async () => {
  try {
    const count = await Notifications.getBadgeCountAsync();
    return count;
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
};

// ============================================================================
// Set Badge Count
// ============================================================================
export const setBadgeCount = async (count) => {
  try {
    await Notifications.setBadgeCountAsync(count);
    return true;
  } catch (error) {
    console.error('Error setting badge count:', error);
    return false;
  }
};

// ============================================================================
// Clear Badge
// ============================================================================
export const clearBadge = async () => {
  try {
    await Notifications.setBadgeCountAsync(0);
    return true;
  } catch (error) {
    console.error('Error clearing badge:', error);
    return false;
  }
};

// ============================================================================
// Setup Notification Listeners
// ============================================================================
export const setupNotificationListeners = (onNotificationReceived, onNotificationTapped) => {
  // Listener for notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    
    const data = response.notification.request.content.data;
    
    if (onNotificationTapped) {
      onNotificationTapped(data);
    }
  });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};

// ============================================================================
// Get All Delivered Notifications
// ============================================================================
export const getDeliveredNotifications = async () => {
  try {
    const notifications = await Notifications.getPresentedNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('Error getting delivered notifications:', error);
    return [];
  }
};

// ============================================================================
// Dismiss All Notifications
// ============================================================================
export const dismissAllNotifications = async () => {
  try {
    await Notifications.dismissAllNotificationsAsync();
    console.log('All notifications dismissed');
    return true;
  } catch (error) {
    console.error('Error dismissing notifications:', error);
    return false;
  }
};

// ============================================================================
// Test Notification (for debugging)
// ============================================================================
export const sendTestNotification = async () => {
  try {
    await scheduleLocalNotification({
      title: 'Test Notification',
      body: 'This is a test notification',
      data: { type: 'test', timestamp: new Date().toISOString() },
    });
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

// ============================================================================
// Handle Different Notification Types
// ============================================================================
export const handleNotificationAction = (data, navigation) => {
  if (!data || !data.type) {
    return;
  }

  switch (data.type) {
    case 'shift_reminder':
      // Navigate to attendance screen
      navigation.navigate('Attendance');
      break;

    case 'location_alert':
      // Navigate to location/map screen
      navigation.navigate('Attendance');
      break;

    case 'system_announcement':
    case 'announcement':
      // Show announcement or navigate to notifications screen
      navigation.navigate('Profile'); // or Notifications screen if you have one
      break;

    case 'attendance_alert':
      // Navigate to history or attendance screen
      navigation.navigate('History');
      break;

    default:
      console.log('Unknown notification type:', data.type);
      break;
  }
};

export default {
  registerForPushNotifications,
  scheduleLocalNotification,
  cancelNotification,
  cancelAllNotifications,
  getBadgeCount,
  setBadgeCount,
  clearBadge,
  setupNotificationListeners,
  getDeliveredNotifications,
  dismissAllNotifications,
  sendTestNotification,
  handleNotificationAction,
};