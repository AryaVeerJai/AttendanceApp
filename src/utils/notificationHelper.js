import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const scheduleNotification = async ({
  title,
  body,
  imageUrl,
  hour,
  minute,
  day = null, // Optional: specific day of week (0-6, Sunday=0)
  repeats = false,
  data = {},
}) => {
  try {
    const trigger = {
      hour,
      minute,
      repeats,
      ...(day !== null && { weekday: day + 1 }), // Expo uses 1-7 (Sunday=1)
    };
    
    const notificationContent = {
      title,
      body,
      data: {
        ...data,
        imageUrl,
      },
      // For Android Big Picture Style
      android: {
        channelId: 'default',
        ...(imageUrl && {
          style: {
            type: Notifications.AndroidNotificationStyle.BIGPICTURE,
            picture: imageUrl,
          },
        }),
      },
      // For iOS attachments (local images only)
      ...(Platform.OS === 'ios' && imageUrl && {
        attachments: [
          {
            identifier: 'image',
            url: imageUrl,
            type: 'image',
          },
        ],
      }),
    };
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
    });
    
    console.log(`Notification scheduled with ID: ${notificationId}`);
    return notificationId;
    
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Notification ${notificationId} cancelled`);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
};

export const getAllScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

export const debugScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('=== Scheduled Notifications Debug ===');
    notifications.forEach((notification, index) => {
      console.log(`Notification ${index + 1}:`);
      console.log('Title:', notification.content.title);
      console.log('Trigger:', JSON.stringify(notification.trigger, null, 2));
      console.log('Scheduled Date:', new Date(notification.trigger.value * 1000 || Date.now()));
      console.log('---');
    });
    return notifications;
  } catch (error) {
    console.error('Debug error:', error);
  }
};