// import React, { useEffect, useState } from 'react';
// import * as Location from 'expo-location';
// import * as TaskManager from 'expo-task-manager';
// import NetInfo from '@react-native-community/netinfo';
// import { Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { sendLocationUpdate, sendOfflineStatus } from '../services/api';

// const LOCATION_TASK_NAME = 'background-location-task';

// const LocationTracker = () => {
//   const [location, setLocation] = useState(null);
//   const [isOnline, setIsOnline] = useState(true);

//   useEffect(() => {
//     startLocationTracking();
//     const unsubscribe = setupNetworkListener();
    
//     return () => {
//       stopLocationTracking();
//       if (unsubscribe) unsubscribe();
//     };
//   }, []);

//   // const startLocationTracking = async () => {
//   //   try {
//   //     // Request permissions first
//   //     const { status } = await Location.requestForegroundPermissionsAsync();
      
//   //     if (status !== 'granted') {
//   //       console.error('Location permission not granted');
//   //       return;
//   //     }

//   //     // Start foreground location updates
//   //     await Location.watchPositionAsync(
//   //       {
//   //         accuracy: Location.Accuracy.BestForNavigation,
//   //         timeInterval: 15000,
//   //         distanceInterval: 10,
//   //       },
//   //       async (newLocation) => {
//   //         setLocation(newLocation);
//   //         await sendLocationData(newLocation);
//   //       }
//   //     );
//   //   } catch (error) {
//   //     console.error('Error starting location tracking:', error);
//   //   }
//   // };


//   const startLocationTracking = async () => {
//   try {
//     const { status } = await Location.requestForegroundPermissionsAsync();
    
//     if (status !== 'granted') {
//       console.error('Location permission not granted');
//       return;
//     }

//     // ✅ Increase timeInterval to reduce frequency
//     await Location.watchPositionAsync(
//       {
//         accuracy: Location.Accuracy.BestForNavigation,
//         timeInterval: 60000,  // Changed from 15000 to 60000 (1 minute)
//         distanceInterval: 50, // Changed from 10 to 50 meters
//       },
//       async (newLocation) => {
//         setLocation(newLocation);
//         await sendLocationData(newLocation);
//       }
//     );
//   } catch (error) {
//     console.error('Error starting location tracking:', error);
//   }
// };

//   const stopLocationTracking = async () => {
//     try {
//       await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
//     } catch (error) {
//       console.error('Error stopping location tracking:', error);
//     }
//   };

//   const setupNetworkListener = () => {
//     const unsubscribe = NetInfo.addEventListener(state => {
//       const wasOnline = isOnline;
//       setIsOnline(state.isConnected);
      
//       if (wasOnline && !state.isConnected) {
//         sendOfflineStatus();
//       } else if (!wasOnline && state.isConnected) {
//         // Reconnected - send current location
//         if (location) {
//           sendLocationData(location);
//         }
//       }
//     });

//     return unsubscribe;
//   };

//   const sendLocationData = async (locationData) => {
//     // ✅ FIX: Define locationPayload at the beginning so it's available in catch block
//     let locationPayload = null;
    
//     try {
//       locationPayload = {
//         latitude: locationData.coords.latitude,
//         longitude: locationData.coords.longitude,
//         accuracy: locationData.coords.accuracy,
//         speed: locationData.coords.speed,
//         heading: locationData.coords.heading,
//         timestamp: new Date().toISOString(),
//         batteryLevel: Platform.OS === 'ios' ? locationData.coords.batteryLevel : null,
//         isForeground: true,
//       };

//       await sendLocationUpdate(locationPayload);
//       console.log('✅ Location sent successfully');
//     } catch (error) {
//       console.log('Error sending location:', error);
//       // console.error('Error sending location:', error);
//       // ✅ Now locationPayload is accessible here
//       if (locationPayload) {
//         await storeLocationOffline(locationPayload);
//       }
//     }
//   };

//   const storeLocationOffline = async (locationData) => {
//     try {
//       const storedLocations = await AsyncStorage.getItem('offlineLocations') || '[]';
//       const locations = JSON.parse(storedLocations);
//       locations.push({
//         ...locationData,
//         synced: false,
//         storedAt: new Date().toISOString(),
//       });
//       await AsyncStorage.setItem('offlineLocations', JSON.stringify(locations));
//       console.log('📍 Location stored offline');
//     } catch (error) {
//       console.error('Error storing location offline:', error);
//     }
//   };

//   return null; // This component doesn't render anything
// };

// export default LocationTracker;


import React, { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendLocationUpdate, sendOfflineStatus } from '../services/api';
import logger from '../utils/logger';

const MAX_OFFLINE_LOCATIONS = 100; // Limit stored locations

const LocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const locationSubscription = useRef(null);
  const networkUnsubscribe = useRef(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    startLocationTracking();
    setupNetworkListener();
    setupAppStateListener();
    
    return () => {
      stopLocationTracking();
      cleanupListeners();
    };
  }, []);

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        logger.error('Location permission not granted');
        return;
      }

      // Store the subscription for proper cleanup
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced, // Changed from BestForNavigation for battery
          timeInterval: 60000,  // 1 minute
          distanceInterval: 50, // 50 meters
        },
        async (newLocation) => {
          setLocation(newLocation);
          await sendLocationData(newLocation);
        }
      );

      logger.info('Foreground location tracking started');
    } catch (error) {
      logger.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    try {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
        logger.info('Location tracking stopped');
      }
    } catch (error) {
      logger.error('Error stopping location tracking:', error);
    }
  };

  const setupNetworkListener = () => {
    networkUnsubscribe.current = NetInfo.addEventListener(state => {
      const previousOnlineState = isOnline;
      const currentOnlineState = state.isConnected && state.isInternetReachable;
      
      setIsOnline(currentOnlineState);
      
      // Going offline
      if (previousOnlineState && !currentOnlineState) {
        handleGoingOffline();
      } 
      // Coming back online
      else if (!previousOnlineState && currentOnlineState) {
        handleComingOnline();
      }
    });
  };

  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground - sync offline data
        syncOfflineLocations();
      }
      appState.current = nextAppState;
    });

    return subscription;
  };

  const cleanupListeners = () => {
    if (networkUnsubscribe.current) {
      networkUnsubscribe.current();
      networkUnsubscribe.current = null;
    }
  };

  const handleGoingOffline = async () => {
    try {
      await sendOfflineStatus();
      logger.info('Sent offline status to server');
    } catch (error) {
      logger.error('Error sending offline status:', error);
    }
  };

  const handleComingOnline = async () => {
    logger.info('Connection restored, syncing offline data');
    await syncOfflineLocations();
    
    // Send current location if available
    if (location) {
      await sendLocationData(location);
    }
  };

  const sendLocationData = async (locationData) => {
    let locationPayload = null;
    
    try {
      locationPayload = {
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
        accuracy: locationData.coords.accuracy,
        speed: locationData.coords.speed || 0,
        heading: locationData.coords.heading || 0,
        timestamp: new Date(locationData.timestamp).toISOString(),
        batteryLevel: Platform.OS === 'ios' ? locationData.coords.batteryLevel : null,
        isForeground: true,
      };

      // Only send if online
      if (isOnline) {
        await sendLocationUpdate(locationPayload);
        logger.info('Location sent successfully', {
          lat: locationPayload.latitude.toFixed(4),
          lng: locationPayload.longitude.toFixed(4),
        });
      } else {
        throw new Error('Device is offline');
      }
    } catch (error) {
      logger.error('Error sending location:', error.message);
      
      // Store offline if payload was created
      if (locationPayload) {
        await storeLocationOffline(locationPayload);
      }
    }
  };

  const storeLocationOffline = async (locationData) => {
    try {
      const storedData = await AsyncStorage.getItem('offlineLocations');
      let locations = storedData ? JSON.parse(storedData) : [];
      
      // Add new location
      locations.push({
        ...locationData,
        synced: false,
        storedAt: new Date().toISOString(),
      });

      // Keep only the most recent locations to prevent unlimited growth
      if (locations.length > MAX_OFFLINE_LOCATIONS) {
        locations = locations.slice(-MAX_OFFLINE_LOCATIONS);
      }

      await AsyncStorage.setItem('offlineLocations', JSON.stringify(locations));
      logger.info('Location stored offline', `Total: ${locations.length}`);
    } catch (error) {
      logger.error('Error storing location offline:', error);
    }
  };

  const syncOfflineLocations = async () => {
    try {
      const storedData = await AsyncStorage.getItem('offlineLocations');
      if (!storedData) return;

      const locations = JSON.parse(storedData);
      const unsyncedLocations = locations.filter(loc => !loc.synced);

      if (unsyncedLocations.length === 0) {
        logger.info('No offline locations to sync');
        return;
      }

      logger.info(`Syncing ${unsyncedLocations.length} offline locations`);

      // Send locations in batches
      const batchSize = 10;
      for (let i = 0; i < unsyncedLocations.length; i += batchSize) {
        const batch = unsyncedLocations.slice(i, i + batchSize);
        
        try {
          await Promise.all(
            batch.map(loc => sendLocationUpdate({
              ...loc,
              isOfflineSync: true,
            }))
          );

          // Mark as synced
          batch.forEach(loc => {
            loc.synced = true;
          });
        } catch (error) {
          logger.error(`Error syncing batch ${i / batchSize + 1}:`, error);
          break; // Stop syncing if a batch fails
        }
      }

      // Remove synced locations
      const remainingLocations = locations.filter(loc => !loc.synced);
      await AsyncStorage.setItem('offlineLocations', JSON.stringify(remainingLocations));
      
      logger.info('Offline sync completed', `Remaining: ${remainingLocations.length}`);
    } catch (error) {
      logger.error('Error syncing offline locations:', error);
    }
  };

  return null; // This component doesn't render anything
};

export default LocationTracker;