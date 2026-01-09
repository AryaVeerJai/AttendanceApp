import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import logger from '../utils/logger';
// import { EXPO_PUBLIC_API_URL } from '@env';


// At the top of api.js
let lastLocationUpdate = null;
let lastUpdateTime = 0;
const MIN_UPDATE_INTERVAL = 30000; // 30 seconds


const API_BASE_URL = `http://143.244.137.105:8082/api`;
// console.log('🌐 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Helper function to get consistent device ID
const getDeviceId = async () => {
  try {
    let deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = Constants.deviceId || `${Device.modelName || 'Unknown'}-${Date.now()}`;
      await AsyncStorage.setItem('deviceId', deviceId);
      console.log('📱 Generated new device ID:', deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return `fallback-${Date.now()}`;
  }
};

// Request interceptor to add token AND device info
api.interceptors.request.use(
  async (config) => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const { token } = JSON.parse(userData);
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add device information headers - using consistent device ID
    const deviceId = await getDeviceId();
    config.headers['x-device-id'] = deviceId;
    config.headers['x-device-name'] = Device.deviceName || 'Unknown Device';
    config.headers['x-device-type'] = Device.osName || 'Unknown OS';
    config.headers['x-os-version'] = Device.osVersion || 'Unknown Version';
    
    // console.log('📤 Request:', config.method.toUpperCase(), config.url);
    logger.api(`${config.method.toUpperCase()} ${config.url}`,'from api.js');
    // console.log('📱 Device ID:', deviceId);
    
    return config;
  },
  (error) => {
    // console.log('❌ Request Interceptor Error:', error);
    logger.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for better error logging
api.interceptors.response.use(
  (response) => {
    logger.debug(`Response: ${response.config.url} [${response.status}]`);
    // console.log('✅ Response Success:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    // console.log('❌ Response Error:', {
    //   url: error.config?.url,
    //   status: error.response?.status,
    //   message: error.response?.data?.message,
    //   data: error.response?.data,
    // });
    logger.error('API Error', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
    });
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      // console.log('🚫 Authentication failed - clearing user data');
      logger.warn('Authentication failed - clearing user data');
      await AsyncStorage.removeItem('userData');
      // Note: Navigation to login should be handled by the app
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    console.log("🔐 API LOGIN CALL");
    try {
      const response = await api.post('/auth/login', credentials);
      console.log("✅ Login successful");
      return response.data;
    } catch (error) {
      console.log("❌ Login error:", error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      await AsyncStorage.removeItem('userData');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
};

// Attendance API
export const attendanceAPI = {
  markAttendance: async (data) => {
    console.log("📍 MARK ATTENDANCE REQUEST");
    try {
      const response = await api.post('/attendance/mark', data);
      console.log("✅ Attendance marked successfully");
      return response.data;
    } catch (error) {
      console.log("❌ Mark attendance error:", error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  getCurrentStatus: async () => {
    try {
      // ✅ FIX: Removed the hardcoded device ID - interceptor will add it
      const response = await api.get('/attendance/current-status');
      return response.data;
    } catch (error) {
      console.error('Get current status error:', error);
      throw error;
    }
  },
  
  getHistory: async (params) => {
    console.log("📜 Fetching attendance history");
    try {
      const response = await api.get('/attendance/history', { params });
      return response.data;
    } catch (error) {
      console.error('Get history error:', error);
      throw error;
    }
  },
};

// Location API
export const locationAPI = {
  updateLocation: async (locationData) => {
    try {
      // Prevent duplicate/rapid updates
      const now = Date.now();
      const isSameLocation = lastLocationUpdate && 
        lastLocationUpdate.latitude === locationData.latitude &&
        lastLocationUpdate.longitude === locationData.longitude;
      
      if (isSameLocation && (now - lastUpdateTime) < MIN_UPDATE_INTERVAL) {
        console.log('⏭️ Skipping duplicate location update');
        return { success: true, skipped: true };
      }
      const networkState = await NetInfo.fetch();
      
      if (!networkState.isConnected) {
        logger.warn('No network - skipping sync');
        // console.log('📴 No network - storing location offline');
        await storeLocationOffline(locationData);
        return { success: false, offline: true };
      }

      const response = await api.post('/location/update', locationData);
      // Update tracking variables
      lastLocationUpdate = locationData;
      lastUpdateTime = now;
      console.log('✅ Location updated successfully');
      return response.data;
    } catch (error) {
      console.log('❌ Location update failed - storing offline');
      await storeLocationOffline(locationData);
      throw error;
    }
  },
  
  getLiveLocations: async () => {
    try {
      const response = await api.get('/location/live');
      return response.data;
    } catch (error) {
      console.error('Get live locations error:', error);
      throw error;
    }
  },
};

// Helper: Store location offline
const storeLocationOffline = async (locationData) => {
  try {
    const stored = await AsyncStorage.getItem('offlineLocations') || '[]';
    const locations = JSON.parse(stored);
    locations.push({
      ...locationData,
      timestamp: new Date().toISOString(),
      synced: false,
    });
    await AsyncStorage.setItem('offlineLocations', JSON.stringify(locations));
    console.log('💾 Location stored offline');
  } catch (error) {
    console.error('Error storing offline location:', error);
  }
};

// Sync offline data when connection is restored
export const syncOfflineData = async () => {
  try {
    logger.info('Starting offline data sync');
    // console.log('🔄 Starting offline data sync...');
    const networkState = await NetInfo.fetch();
    
    if (!networkState.isConnected) {
      console.log('📴 No network - skipping sync');
      return;
    }
    
    let syncedCount = 0;
    let skippedCount = 0;
    
    // Sync offline locations with rate limiting
    const locations = await AsyncStorage.getItem('offlineLocations') || '[]';
    const locationList = JSON.parse(locations);
    const unsyncedLocations = locationList.filter(loc => !loc.synced);
    
    console.log(`📍 Found ${unsyncedLocations.length} unsynced locations`);
    
    for (const location of unsyncedLocations) {
      try {
        await locationAPI.updateLocation(location);
        location.synced = true;
        syncedCount++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      } catch (error) {
        if (error.response?.status === 429) {
          console.log('⚠️ Rate limited - stopping location sync');
          break; // Stop syncing if rate limited
        }
        console.error('Failed to sync location:', error.message);
      }
    }
    
    // Sync offline attendance - with duplicate detection
    const attendances = await AsyncStorage.getItem('offlineAttendance') || '[]';
    const attendanceList = JSON.parse(attendances);
    const unsyncedAttendance = attendanceList.filter(att => !att.synced);
    
    console.log(`📋 Found ${unsyncedAttendance.length} unsynced attendance records`);
    
    for (const attendance of unsyncedAttendance) {
      try {
        await attendanceAPI.markAttendance(attendance);
        attendance.synced = true;
        syncedCount++;
      } catch (error) {
        // ✅ If already clocked in/out, mark as synced anyway
        if (error.response?.status === 400 && 
            (error.response?.data?.message?.includes('Already clocked') ||
             error.response?.data?.message?.includes('already'))) {
          console.log('⚠️ Attendance already exists - marking as synced');
          attendance.synced = true;
          skippedCount++;
        } else {
          console.error('Failed to sync attendance:', error.message);
        }
      }
    }
    
    // Update storage with synced flags
    await AsyncStorage.setItem('offlineLocations', JSON.stringify(locationList));
    await AsyncStorage.setItem('offlineAttendance', JSON.stringify(attendanceList));
    
    // console.log(`✅ Sync complete - ${syncedCount} synced, ${skippedCount} skipped`);
    logger.info(`Sync complete - ${syncedCount} synced, ${skippedCount} skipped`);
    return { success: true, syncedCount, skippedCount };
  } catch (error) {
    console.error('Error syncing offline data:', error);
    return { success: false, error: error.message };
  }
};

// Send location update
export const sendLocationUpdate = async (locationData) => {
  try {
    const response = await locationAPI.updateLocation(locationData);
    return response;
  } catch (error) {
    console.error('Error sending location update:', error);
    throw error;
  }
};

// Send offline status
export const sendOfflineStatus = async () => {
  try {
    const response = await api.post('/location/offline');
    return response.data;
  } catch (error) {
    console.error('Error sending offline status:', error);
    // Silent fail for offline status
  }
};

export default api;