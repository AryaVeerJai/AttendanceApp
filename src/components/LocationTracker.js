// import React, { useEffect, useState } from 'react';
// import * as Location from 'expo-location';
// import * as TaskManager from 'expo-task-manager';
// import NetInfo from '@react-native-community/netinfo';
// import { Platform } from 'react-native';
// import { sendLocationUpdate, sendOfflineStatus } from '../services/api';

// const LOCATION_TASK_NAME = 'background-location-task';

// const LocationTracker = () => {
//   const [location, setLocation] = useState(null);
//   const [isOnline, setIsOnline] = useState(true);

//   useEffect(() => {
//     startLocationTracking();
//     setupNetworkListener();
    
//     return () => {
//       stopLocationTracking();
//     };
//   }, []);

//   const startLocationTracking = async () => {
//     try {
//       // Start foreground location updates
//       await Location.watchPositionAsync(
//         {
//           accuracy: Location.Accuracy.BestForNavigation,
//           timeInterval: 15000,
//           distanceInterval: 10,
//         },
//         async (newLocation) => {
//           setLocation(newLocation);
//           await sendLocationData(newLocation);
//         }
//       );
//     } catch (error) {
//       console.error('Error starting location tracking:', error);
//     }
//   };

//   const stopLocationTracking = async () => {
//     await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
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
//     try {
//       const locationPayload = {
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
//     } catch (error) {
//       console.error('Error sending location:', error);
//       // Store locally if offline
//       await storeLocationOffline(locationPayload);
//     }
//   };

//   const storeLocationOffline = async (locationData) => {
//     try {
//       const storedLocations = await AsyncStorage.getItem('offlineLocations') || '[]';
//       const locations = JSON.parse(storedLocations);
//       locations.push(locationData);
//       await AsyncStorage.setItem('offlineLocations', JSON.stringify(locations));
//     } catch (error) {
//       console.error('Error storing location offline:', error);
//     }
//   };

//   return null; // This component doesn't render anything
// };

// export default LocationTracker;



import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendLocationUpdate, sendOfflineStatus } from '../services/api';

const LOCATION_TASK_NAME = 'background-location-task';

const LocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    startLocationTracking();
    const unsubscribe = setupNetworkListener();
    
    return () => {
      stopLocationTracking();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // const startLocationTracking = async () => {
  //   try {
  //     // Request permissions first
  //     const { status } = await Location.requestForegroundPermissionsAsync();
      
  //     if (status !== 'granted') {
  //       console.error('Location permission not granted');
  //       return;
  //     }

  //     // Start foreground location updates
  //     await Location.watchPositionAsync(
  //       {
  //         accuracy: Location.Accuracy.BestForNavigation,
  //         timeInterval: 15000,
  //         distanceInterval: 10,
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


  const startLocationTracking = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.error('Location permission not granted');
      return;
    }

    // ✅ Increase timeInterval to reduce frequency
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 60000,  // Changed from 15000 to 60000 (1 minute)
        distanceInterval: 50, // Changed from 10 to 50 meters
      },
      async (newLocation) => {
        setLocation(newLocation);
        await sendLocationData(newLocation);
      }
    );
  } catch (error) {
    console.error('Error starting location tracking:', error);
  }
};

  const stopLocationTracking = async () => {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = isOnline;
      setIsOnline(state.isConnected);
      
      if (wasOnline && !state.isConnected) {
        sendOfflineStatus();
      } else if (!wasOnline && state.isConnected) {
        // Reconnected - send current location
        if (location) {
          sendLocationData(location);
        }
      }
    });

    return unsubscribe;
  };

  const sendLocationData = async (locationData) => {
    // ✅ FIX: Define locationPayload at the beginning so it's available in catch block
    let locationPayload = null;
    
    try {
      locationPayload = {
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
        accuracy: locationData.coords.accuracy,
        speed: locationData.coords.speed,
        heading: locationData.coords.heading,
        timestamp: new Date().toISOString(),
        batteryLevel: Platform.OS === 'ios' ? locationData.coords.batteryLevel : null,
        isForeground: true,
      };

      await sendLocationUpdate(locationPayload);
      console.log('✅ Location sent successfully');
    } catch (error) {
      console.log('Error sending location:', error);
      // console.error('Error sending location:', error);
      // ✅ Now locationPayload is accessible here
      if (locationPayload) {
        await storeLocationOffline(locationPayload);
      }
    }
  };

  const storeLocationOffline = async (locationData) => {
    try {
      const storedLocations = await AsyncStorage.getItem('offlineLocations') || '[]';
      const locations = JSON.parse(storedLocations);
      locations.push({
        ...locationData,
        synced: false,
        storedAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem('offlineLocations', JSON.stringify(locations));
      console.log('📍 Location stored offline');
    } catch (error) {
      console.error('Error storing location offline:', error);
    }
  };

  return null; // This component doesn't render anything
};

export default LocationTracker;