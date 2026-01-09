// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <Text>Open up App.js to start working on your app!</Text>
//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef, AppState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import NotificationScheduler from './src/components/NotificationScheduler';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LocationTracker from './src/components/LocationTracker';
import { getDeviceId, getDeviceInfo } from './src/utils/deviceHelper';

// const apiUrl = import.meta.env.EXPO_PUBLIC_API_URL;
import { EXPO_PUBLIC_API_URL } from '@env';

const Stack = createStackNavigator();

// Background location task
const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    if (location) {
      // Send location to backend
      await sendLocationToBackend(location);
    }
  }
});

async function sendLocationToBackend(location) {
  const deviceId = await getDeviceId();
  const deviceInfo = getDeviceInfo();
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const { employeeId, token } = JSON.parse(userData);
      
      // await fetch('YOUR_BACKEND_API/location/update', {
      // await fetch('http://192.168.29.54:8082/api/location/update', {
      await fetch(`${EXPO_PUBLIC_API_URL}api/location/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracy: location.coords.accuracy,
          isBackground: true,
          deviceId: deviceId, // You can generate this
        }),
      });
    }
  } catch (error) {
    console.log('Error sending location:', error);
    // console.error('Error sending location:', error);
  }
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    checkLoginStatus();
    requestPermissions();
    setupNotifications();

        
    // Listeners for notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };

  }, []);

  const checkLoginStatus = async () => {
    // Check if user is logged in from AsyncStorage
    const userData = await AsyncStorage.getItem('userData');
    setIsLoggedIn(!!userData);
  };

  const requestPermissions = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    setLocationPermission(foregroundStatus === 'granted');
    
    if (backgroundStatus === 'granted') {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // Update every 30 seconds
        distanceInterval: 50, // Update every 50 meters
        showsBackgroundLocationIndicator: true,
      });
    }
  };

  // const setupNotifications = async () => {
  //   const { status } = await Notifications.requestPermissionsAsync();
  //   if (status !== 'granted') {
  //     alert('Failed to get push token for notifications!');
  //   }
  // };

//   const setupNotifications = async () => {
//   try {
//     const { status } = await Notifications.requestPermissionsAsync();
//     if (status !== 'granted') {
//       console.log('Notification permissions not granted');
//       // Don't show alert, just log it
//     } else {
//       console.log('Notification permissions granted');
//     }
//   } catch (error) {
//     console.log('Notifications not available:', error.message);
//     // App continues to work without notifications - no alert needed
//   }
// };

const setupNotifications = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }
    
    console.log('Notification permissions granted');
    
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    
    // For Android: Create notification channel
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    
  } catch (error) {
    console.log('Notifications not available:', error.message);
  }
};

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {!isLoggedIn ? (
            // <Stack.Screen 
            //   name="Login" 
            //   component={LoginScreen} 
            //   options={{ headerShown: false }}
            // />
            <Stack.Screen
              name="Login"
              options={{ headerShown: false }}
            >
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={checkLoginStatus}
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen 
                name="Attendance" 
                component={AttendanceScreen} 
                options={{ title: 'Wattn Attendance Tracking' }}
              />

              <Stack.Screen
              name="Profile"
              options={{ title: 'Profile' }}
            >
              {(props) => (
                <ProfileScreen
                  {...props}
                  onLogoutSuccess={checkLoginStatus}
                />
              )}
            </Stack.Screen>
              {/* <Stack.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ title: 'Profile' }}
              /> */}
              <Stack.Screen 
                name="History" 
                component={HistoryScreen} 
                options={{ title: 'Attendance History' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {isLoggedIn && locationPermission && <LocationTracker />}
      {isLoggedIn && <NotificationScheduler />}
    </SafeAreaProvider>
  );
}