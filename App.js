import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import NotificationScheduler from './src/components/NotificationScheduler';
import LocationTracker from './src/components/LocationTracker';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { getDeviceId, getDeviceInfo } from './src/utils/deviceHelper';
import logger from './src/utils/logger';

const Stack = createStackNavigator();
const EXPO_PUBLIC_API_URL = "https://attendance.wattnengineering.com/api";

// Background location task
const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  logger.background('BACKGROUND TASK TRIGGERED', new Date().toLocaleString());
  
  if (error) {
    logger.error('Location task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    if (location) {
      logger.location('Background location captured', {
        lat: location.coords.latitude.toFixed(4),
        lng: location.coords.longitude.toFixed(4),
        accuracy: location.coords.accuracy
      });

      await sendLocationToBackend(location);
    }
  }

  logger.background('TASK COMPLETED', new Date().toLocaleString());
});

async function sendLocationToBackend(location) {
  try {
    const deviceId = await getDeviceId();
    const deviceInfo = getDeviceInfo();
    const userData = await AsyncStorage.getItem('userData');
    
    if (userData) {
      const { employeeId, token } = JSON.parse(userData);
      
      const payload = {
        employeeId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
        accuracy: location.coords.accuracy,
        isBackground: true,
        deviceId: deviceId,
        deviceInfo: deviceInfo,
      };
      
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/location/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        logger.error('Failed to send background location:', response.status);
      } else {
        logger.info('Background location sent successfully');
      }
    }
  } catch (error) {
    logger.error('Background location error:', error.message);
  }
}

// Helper function to start background tracking
async function startBackgroundTracking() {
  try {
    // Check if app is in foreground
    const appStateValue = AppState.currentState;
    if (appStateValue !== 'active') {
      logger.info('Cannot start background tracking - app not in foreground');
      return false;
    }

    const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
    
    if (backgroundStatus === 'granted') {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      
      if (!hasStarted) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 300000, // 5 minutes
          distanceInterval: 100, // 100 meters
          deferredUpdatesInterval: 300000,
          deferredUpdatesDistance: 100,
          foregroundService: {
            notificationTitle: 'Attendance Tracking Active',
            notificationBody: 'Tracking your location for work attendance',
            notificationColor: '#007AFF',
          },
          showsBackgroundLocationIndicator: true,
          pausesUpdatesAutomatically: false,
        });
        
        logger.background('Background tracking started');
        return true;
      } else {
        logger.info('Background tracking already running');
        return true;
      }
    } else {
      logger.info('Background permission not granted');
      return false;
    }
  } catch (error) {
    logger.error('Error starting background tracking:', error);
    return false;
  }
}

// Helper function to stop background tracking
export async function stopBackgroundTracking() {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      logger.background('Background tracking stopped');
    }
  } catch (error) {
    logger.error('Error stopping background tracking:', error);
  }
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkLoginStatus();
    setupNotifications();
    setupAppStateListener();
    requestPermissions();

    // Listeners for notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // Start background tracking after login if permissions already granted
  useEffect(() => {
    if (isLoggedIn && locationPermission) {
      // Small delay to ensure app is stable
      setTimeout(() => {
        startBackgroundTrackingIfPermitted();
      }, 2000);
    }
  }, [isLoggedIn, locationPermission]);

  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // App going to background
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        logger.info('App going to background - background tracking continues');
      }
      
      // App coming to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        logger.info('App came to foreground');
        
        // Try to start background tracking if logged in and not already started
        if (isLoggedIn && locationPermission) {
          const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
          
          if (!hasStarted) {
            logger.info('Restarting background tracking after app came to foreground');
            setTimeout(async () => {
              await startBackgroundTracking();
            }, 1000);
          }
        }
      }
      
      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  };

  const checkLoginStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      setIsLoggedIn(!!userData);
    } catch (error) {
      logger.error('Error checking login status:', error);
      setIsLoggedIn(false);
    }
  };

  const requestPermissions = async () => {
    try {
      // Request foreground location
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location permission is required for attendance tracking"
        );
        setLocationPermission(false);
        return;
      }

      setLocationPermission(true);
      logger.info('Foreground location permission granted');

      // Request background location
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Background Permission Recommended',
          'For best results, enable "Allow all the time" in location settings. This allows attendance tracking when the app is closed.'
        );
        logger.info('Background location permission denied');
      } else {
        logger.info('Background location permission granted');
      }
      
    } catch (error) {
      logger.error('Error requesting permissions:', error);
      setLocationPermission(false);
    }
  };

  const startBackgroundTrackingIfPermitted = async () => {
    try {
      // Ensure app is in foreground before starting
      if (appState.current !== 'active') {
        logger.info('App not in foreground, will retry when app becomes active');
        return;
      }

      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
      
      if (backgroundStatus === 'granted') {
        const success = await startBackgroundTracking();
        if (!success) {
          logger.info('Background tracking not started, will retry later');
        }
      } else {
        logger.info('Background permission not granted, skipping background tracking');
      }
    } catch (error) {
      logger.error('Error checking background permission:', error);
    }
  };

  const setupNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }
      
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

  const handleLogout = async () => {
    await stopBackgroundTracking();
    await checkLoginStatus();
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {!isLoggedIn ? (
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
                    onLogoutSuccess={handleLogout}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen 
                name="History" 
                component={HistoryScreen} 
                options={{ title: 'Attendance History' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      
      {/* Foreground tracking when app is active */}
      {isLoggedIn && locationPermission && <LocationTracker />}
      
      {/* Notifications */}
      {isLoggedIn && <NotificationScheduler />}
    </SafeAreaProvider>
  );
}