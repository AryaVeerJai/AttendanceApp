import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { locationAPI } from './api';

const LOCATION_TASK_NAME = 'background-location-task';

export const locationService = {
  // Request location permissions
  requestPermissions: async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      return {
        foreground: foregroundStatus === 'granted',
        background: backgroundStatus === 'granted',
        granted: foregroundStatus === 'granted' && backgroundStatus === 'granted',
      };
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return {
        foreground: false,
        background: false,
        granted: false,
        error: error.message,
      };
    }
  },

  // Start background location tracking
  startBackgroundTracking: async () => {
    try {
      const { granted } = await locationService.requestPermissions();
      
      if (!granted) {
        throw new Error('Location permissions not granted');
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 50, // 50 meters
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Location Tracking Active',
          notificationBody: 'Your location is being tracked for attendance',
          notificationColor: '#007AFF',
        },
      });

      return { success: true, message: 'Background tracking started' };
    } catch (error) {
      console.error('Error starting background tracking:', error);
      return { success: false, error: error.message };
    }
  },

  // Stop background location tracking
  stopBackgroundTracking: async () => {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      return { success: true, message: 'Background tracking stopped' };
    } catch (error) {
      console.error('Error stopping background tracking:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current location
  getCurrentLocation: async (options = {}) => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        ...options,
      });

      // Get address from coordinates
      const address = await locationService.getAddressFromCoords(location.coords);

      return {
        success: true,
        location: {
          ...location,
          address,
        },
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return {
        success: false,
        error: error.message,
        location: null,
      };
    }
  },

  // Get address from coordinates
  getAddressFromCoords: async (coords) => {
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (address.length > 0) {
        const addr = address[0];
        return {
          formatted: `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim(),
          street: addr.street,
          city: addr.city,
          region: addr.region,
          country: addr.country,
          postalCode: addr.postalCode,
          name: addr.name,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  },

  // Watch location updates
  watchLocation: async (callback, options = {}) => {
    try {
      const { granted } = await locationService.requestPermissions();
      
      if (!granted) {
        throw new Error('Location permissions not granted');
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 15000,
          distanceInterval: 10,
          ...options,
        },
        async (location) => {
          const address = await locationService.getAddressFromCoords(location.coords);
          callback({
            ...location,
            address,
          });
        }
      );

      return subscription;
    } catch (error) {
      console.error('Error watching location:', error);
      throw error;
    }
  },

  // Send location update to server
  sendLocationUpdate: async (locationData) => {
    try {
      const networkState = await NetInfo.fetch();
      
      if (!networkState.isConnected) {
        // Store offline
        await storeLocationOffline(locationData);
        return {
          success: true,
          offline: true,
          message: 'Location saved offline',
        };
      }

      // Get user data
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        throw new Error('User not logged in');
      }

      const { employeeId } = JSON.parse(userData);
      
      const response = await locationAPI.updateLocation({
        employeeId,
        ...locationData,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
          model: Platform.OS === 'ios' ? '' : '', // Add device model if needed
        },
        batteryLevel: locationData.batteryLevel,
        isCharging: locationData.isCharging || false,
      });

      // If successful, sync any pending offline locations
      if (response.success) {
        await syncPendingLocations();
      }

      return response;
    } catch (error) {
      console.log('Error sending location update:', error);
      // console.error('Error sending location update:', error);
      
      // Store offline on error
      await storeLocationOffline(locationData);
      
      return {
        success: true,
        offline: true,
        message: 'Location saved offline due to error',
      };
    }
  },

  // Get location history
  getLocationHistory: async (params = {}) => {
    try {
      const stored = await AsyncStorage.getItem('locationHistory') || '[]';
      let history = JSON.parse(stored);

      // Apply filters
      if (params.startDate) {
        history = history.filter(loc => 
          new Date(loc.timestamp) >= new Date(params.startDate)
        );
      }
      
      if (params.endDate) {
        history = history.filter(loc => 
          new Date(loc.timestamp) <= new Date(params.endDate)
        );
      }

      if (params.limit) {
        history = history.slice(0, params.limit);
      }

      return {
        success: true,
        data: history,
        count: history.length,
      };
    } catch (error) {
      console.error('Error getting location history:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0,
      };
    }
  },

  // Clear location history
  clearLocationHistory: async () => {
    try {
      await AsyncStorage.removeItem('locationHistory');
      await AsyncStorage.removeItem('offlineLocations');
      return { success: true, message: 'Location history cleared' };
    } catch (error) {
      console.error('Error clearing location history:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if location services are enabled
  checkLocationServices: async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      const foregroundGranted = await Location.getForegroundPermissionsAsync();
      const backgroundGranted = await Location.getBackgroundPermissionsAsync();

      return {
        servicesEnabled,
        foregroundGranted: foregroundGranted.status === 'granted',
        backgroundGranted: backgroundGranted.status === 'granted',
        allGranted: servicesEnabled && 
                    foregroundGranted.status === 'granted' && 
                    backgroundGranted.status === 'granted',
      };
    } catch (error) {
      console.error('Error checking location services:', error);
      return {
        servicesEnabled: false,
        foregroundGranted: false,
        backgroundGranted: false,
        allGranted: false,
        error: error.message,
      };
    }
  },
};

// Store location offline
const storeLocationOffline = async (locationData) => {
  try {
    const stored = await AsyncStorage.getItem('offlineLocations') || '[]';
    const locations = JSON.parse(stored);
    
    locations.push({
      ...locationData,
      timestamp: new Date().toISOString(),
      synced: false,
      storedAt: new Date().toISOString(),
    });

    // Keep only last 1000 locations to prevent storage overflow
    if (locations.length > 1000) {
      locations.splice(0, locations.length - 1000);
    }

    await AsyncStorage.setItem('offlineLocations', JSON.stringify(locations));

    // Also add to location history
    await addToLocationHistory(locationData);
  } catch (error) {
    console.error('Error storing location offline:', error);
    throw error;
  }
};

// Add location to history
const addToLocationHistory = async (locationData) => {
  try {
    const stored = await AsyncStorage.getItem('locationHistory') || '[]';
    const history = JSON.parse(stored);
    
    history.push({
      ...locationData,
      timestamp: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
    });

    // Keep only last 5000 entries
    if (history.length > 5000) {
      history.splice(0, history.length - 5000);
    }

    await AsyncStorage.setItem('locationHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Error adding to location history:', error);
  }
};

// Sync pending locations
const syncPendingLocations = async () => {
  try {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      return { success: false, message: 'No network connection' };
    }

    const stored = await AsyncStorage.getItem('offlineLocations') || '[]';
    const locations = JSON.parse(stored);
    
    const unsynced = locations.filter(loc => !loc.synced);
    
    if (unsynced.length === 0) {
      return { success: true, message: 'No pending locations to sync' };
    }

    let syncedCount = 0;
    let failedCount = 0;

    for (const location of unsynced) {
      try {
        const response = await locationAPI.updateLocation(location);
        
        if (response.success) {
          location.synced = true;
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error('Error syncing location:', error);
        failedCount++;
      }
    }

    // Update storage
    await AsyncStorage.setItem('offlineLocations', JSON.stringify(locations));

    return {
      success: true,
      syncedCount,
      failedCount,
      total: unsynced.length,
    };
  } catch (error) {
    console.error('Error syncing pending locations:', error);
    return { success: false, error: error.message };
  }
};

// Define background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    if (location) {
      try {
        await locationService.sendLocationUpdate({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
          heading: location.coords.heading,
          altitude: location.coords.altitude,
          batteryLevel: location.coords.batteryLevel,
          isBackground: true,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error in background task:', error);
      }
    }
  }
});

// Export individual functions
export const requestLocationPermissions = locationService.requestPermissions;
export const startBackgroundTracking = locationService.startBackgroundTracking;
export const stopBackgroundTracking = locationService.stopBackgroundTracking;
export const getCurrentLocation = locationService.getCurrentLocation;
export const getAddressFromCoords = locationService.getAddressFromCoords;
export const watchLocation = locationService.watchLocation;
export const sendLocationUpdate = locationService.sendLocationUpdate;
export const getLocationHistory = locationService.getLocationHistory;
export const clearLocationHistory = locationService.clearLocationHistory;
export const checkLocationServices = locationService.checkLocationServices;