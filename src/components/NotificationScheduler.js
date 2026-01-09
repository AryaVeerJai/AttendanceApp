import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NotificationScheduler = () => {

  useEffect(() => {
    initNotifications();
  }, []);

  const initNotifications = async () => {
    try {
      const scheduled = await AsyncStorage.getItem('notificationsScheduled');
      if (scheduled === 'true') {
        console.log('Notifications already scheduled');
        return;
      }

      // Android channel (REQUIRED)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('attendance', {
          name: 'Attendance Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      // Morning check-in reminder (9:00 AM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Good Morning ☀️',
          body: 'Don’t forget to check in!',
          sound: true,
        },
        trigger: {
          hour: 9,
          minute: 30,
          repeats: true,
          channelId: 'attendance',
        },
      });

      // Lunch check-out (1:00 PM)
    //   await Notifications.scheduleNotificationAsync({
    //     content: {
    //       title: 'Lunch Break 🍽️',
    //       body: 'Remember to check out for lunch.',
    //       sound: true,
    //     },
    //     trigger: {
    //       hour: 13,
    //       minute: 55,
    //       repeats: true,
    //       channelId: 'attendance',
    //     },
    //   });

      // End of day check-out (6:00 PM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'End of Workday 🌇',
          body: 'Time to check out.',
          sound: true,
        },
        trigger: {
          hour: 18,
          minute: 0,
          repeats: true,
          channelId: 'attendance',
        },
      });

      await AsyncStorage.setItem('notificationsScheduled', 'true');
      console.log('Attendance notifications scheduled');

    } catch (err) {
      console.error('Notification scheduling error:', err);
    }
  };

  return null;
};

export default NotificationScheduler;
