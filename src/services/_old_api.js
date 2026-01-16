// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import NetInfo from '@react-native-community/netinfo';
// import Constants from 'expo-constants';
// import * as Device from 'expo-device';
// import logger from '../utils/logger';
// // import { EXPO_PUBLIC_API_URL } from '@env';


// // At the top of api.js
// let lastLocationUpdate = null;
// let lastUpdateTime = 0;
// const MIN_UPDATE_INTERVAL = 30000; // 30 seconds


// const API_BASE_URL = `http://143.244.137.105:8082/api`;
// // console.log('🌐 API Base URL:', API_BASE_URL);

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 10000,
// });

// // Helper function to get consistent device ID
// const getDeviceId = async () => {
//   try {
//     let deviceId = await AsyncStorage.getItem('deviceId');
//     if (!deviceId) {
//       deviceId = Constants.deviceId || `${Device.modelName || 'Unknown'}-${Date.now()}`;
//       await AsyncStorage.setItem('deviceId', deviceId);
//       console.log('📱 Generated new device ID:', deviceId);
//     }
//     return deviceId;
//   } catch (error) {
//     console.error('Error getting device ID:', error);
//     return `fallback-${Date.now()}`;
//   }
// };

// // Request interceptor to add token AND device info
// api.interceptors.request.use(
//   async (config) => {
//     const userData = await AsyncStorage.getItem('userData');
//     if (userData) {
//       const { token } = JSON.parse(userData);
//       config.headers.Authorization = `Bearer ${token}`;
//     }
    
//     // Add device information headers - using consistent device ID
//     const deviceId = await getDeviceId();
//     config.headers['x-device-id'] = deviceId;
//     config.headers['x-device-name'] = Device.deviceName || 'Unknown Device';
//     config.headers['x-device-type'] = Device.osName || 'Unknown OS';
//     config.headers['x-os-version'] = Device.osVersion || 'Unknown Version';
    
//     // console.log('📤 Request:', config.method.toUpperCase(), config.url);
//     logger.api(`${config.method.toUpperCase()} ${config.url}`,'from api.js');
//     // console.log('📱 Device ID:', deviceId);
    
//     return config;
//   },
//   (error) => {
//     // console.log('❌ Request Interceptor Error:', error);
//     logger.error('Request error:', error);
//     return Promise.reject(error);
//   }
// );

// // Response interceptor for better error logging
// api.interceptors.response.use(
//   (response) => {
//     logger.debug(`Response: ${response.config.url} [${response.status}]`);
//     // console.log('✅ Response Success:', response.config.url, response.status);
//     return response;
//   },
//   async (error) => {
//     // console.log('❌ Response Error:', {
//     //   url: error.config?.url,
//     //   status: error.response?.status,
//     //   message: error.response?.data?.message,
//     //   data: error.response?.data,
//     // });
//     logger.error('API Error', {
//       url: error.config?.url,
//       status: error.response?.status,
//       message: error.response?.data?.message,
//     });
    
//     if (error.response?.status === 401 || error.response?.status === 403) {
//       // console.log('🚫 Authentication failed - clearing user data');
//       logger.warn('Authentication failed - clearing user data');
//       await AsyncStorage.removeItem('userData');
//       // Note: Navigation to login should be handled by the app
//     }
//     return Promise.reject(error);
//   }
// );

// // Auth API
// export const authAPI = {
//   login: async (credentials) => {
//     console.log("🔐 API LOGIN CALL");
//     try {
//       const response = await api.post('/auth/login', credentials);
//       console.log("✅ Login successful");
//       return response.data;
//     } catch (error) {
//       console.log("❌ Login error:", error.response?.data?.message || error.message);
//       throw error;
//     }
//   },
  
//   logout: async () => {
//     try {
//       const response = await api.post('/auth/logout');
//       await AsyncStorage.removeItem('userData');
//       return response.data;
//     } catch (error) {
//       console.error('Logout error:', error);
//       throw error;
//     }
//   },
// };

// // Attendance API
// export const attendanceAPI = {
//   markAttendance: async (data) => {
//     console.log("📍 MARK ATTENDANCE REQUEST");
//     try {
//       const response = await api.post('/attendance/mark', data);
//       console.log("✅ Attendance marked successfully");
//       return response.data;
//     } catch (error) {
//       console.log("❌ Mark attendance error:", error.response?.data?.message || error.message);
//       throw error;
//     }
//   },
  
//   getCurrentStatus: async () => {
//     try {
//       // ✅ FIX: Removed the hardcoded device ID - interceptor will add it
//       const response = await api.get('/attendance/current-status');
//       return response.data;
//     } catch (error) {
//       console.error('Get current status error:', error);
//       throw error;
//     }
//   },
  
//   getHistory: async (params) => {
//     console.log("📜 Fetching attendance history");
//     try {
//       const response = await api.get('/attendance/history', { params });
//       return response.data;
//     } catch (error) {
//       console.error('Get history error:', error);
//       throw error;
//     }
//   },
// };

// // Location API
// export const locationAPI = {
//   updateLocation: async (locationData) => {
//     try {
//       // Prevent duplicate/rapid updates
//       const now = Date.now();
//       const isSameLocation = lastLocationUpdate && 
//         lastLocationUpdate.latitude === locationData.latitude &&
//         lastLocationUpdate.longitude === locationData.longitude;
      
//       if (isSameLocation && (now - lastUpdateTime) < MIN_UPDATE_INTERVAL) {
//         console.log('⏭️ Skipping duplicate location update');
//         return { success: true, skipped: true };
//       }
//       const networkState = await NetInfo.fetch();
      
//       if (!networkState.isConnected) {
//         logger.warn('No network - skipping sync');
//         // console.log('📴 No network - storing location offline');
//         await storeLocationOffline(locationData);
//         return { success: false, offline: true };
//       }

//       const response = await api.post('/location/update', locationData);
//       // Update tracking variables
//       lastLocationUpdate = locationData;
//       lastUpdateTime = now;
//       console.log('✅ Location updated successfully');
//       return response.data;
//     } catch (error) {
//       console.log('❌ Location update failed - storing offline');
//       await storeLocationOffline(locationData);
//       throw error;
//     }
//   },
  
//   getLiveLocations: async () => {
//     try {
//       const response = await api.get('/location/live');
//       return response.data;
//     } catch (error) {
//       console.error('Get live locations error:', error);
//       throw error;
//     }
//   },
// };

// // Helper: Store location offline
// const storeLocationOffline = async (locationData) => {
//   try {
//     const stored = await AsyncStorage.getItem('offlineLocations') || '[]';
//     const locations = JSON.parse(stored);
//     locations.push({
//       ...locationData,
//       timestamp: new Date().toISOString(),
//       synced: false,
//     });
//     await AsyncStorage.setItem('offlineLocations', JSON.stringify(locations));
//     console.log('💾 Location stored offline');
//   } catch (error) {
//     console.error('Error storing offline location:', error);
//   }
// };

// // Sync offline data when connection is restored
// export const syncOfflineData = async () => {
//   try {
//     logger.info('Starting offline data sync');
//     // console.log('🔄 Starting offline data sync...');
//     const networkState = await NetInfo.fetch();
    
//     if (!networkState.isConnected) {
//       console.log('📴 No network - skipping sync');
//       return;
//     }
    
//     let syncedCount = 0;
//     let skippedCount = 0;
    
//     // Sync offline locations with rate limiting
//     const locations = await AsyncStorage.getItem('offlineLocations') || '[]';
//     const locationList = JSON.parse(locations);
//     const unsyncedLocations = locationList.filter(loc => !loc.synced);
    
//     console.log(`📍 Found ${unsyncedLocations.length} unsynced locations`);
    
//     for (const location of unsyncedLocations) {
//       try {
//         await locationAPI.updateLocation(location);
//         location.synced = true;
//         syncedCount++;
        
//         // Add delay to avoid rate limiting
//         await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
//       } catch (error) {
//         if (error.response?.status === 429) {
//           console.log('⚠️ Rate limited - stopping location sync');
//           break; // Stop syncing if rate limited
//         }
//         console.error('Failed to sync location:', error.message);
//       }
//     }
    
//     // Sync offline attendance - with duplicate detection
//     const attendances = await AsyncStorage.getItem('offlineAttendance') || '[]';
//     const attendanceList = JSON.parse(attendances);
//     const unsyncedAttendance = attendanceList.filter(att => !att.synced);
    
//     console.log(`📋 Found ${unsyncedAttendance.length} unsynced attendance records`);
    
//     for (const attendance of unsyncedAttendance) {
//       try {
//         await attendanceAPI.markAttendance(attendance);
//         attendance.synced = true;
//         syncedCount++;
//       } catch (error) {
//         // ✅ If already clocked in/out, mark as synced anyway
//         if (error.response?.status === 400 && 
//             (error.response?.data?.message?.includes('Already clocked') ||
//              error.response?.data?.message?.includes('already'))) {
//           console.log('⚠️ Attendance already exists - marking as synced');
//           attendance.synced = true;
//           skippedCount++;
//         } else {
//           console.error('Failed to sync attendance:', error.message);
//         }
//       }
//     }
    
//     // Update storage with synced flags
//     await AsyncStorage.setItem('offlineLocations', JSON.stringify(locationList));
//     await AsyncStorage.setItem('offlineAttendance', JSON.stringify(attendanceList));
    
//     // console.log(`✅ Sync complete - ${syncedCount} synced, ${skippedCount} skipped`);
//     logger.info(`Sync complete - ${syncedCount} synced, ${skippedCount} skipped`);
//     return { success: true, syncedCount, skippedCount };
//   } catch (error) {
//     console.error('Error syncing offline data:', error);
//     return { success: false, error: error.message };
//   }
// };

// // Send location update
// export const sendLocationUpdate = async (locationData) => {
//   try {
//     const response = await locationAPI.updateLocation(locationData);
//     return response;
//   } catch (error) {
//     console.error('Error sending location update:', error);
//     throw error;
//   }
// };

// // Send offline status
// export const sendOfflineStatus = async () => {
//   try {
//     const response = await api.post('/location/offline');
//     return response.data;
//   } catch (error) {
//     console.error('Error sending offline status:', error);
//     // Silent fail for offline status
//   }
// };

// export default api;




import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import logger from '../utils/logger';

// Configuration constants
const API_BASE_URL = 'https://attendance.wattnengineering.com/api';
const REQUEST_TIMEOUT = 10000;
const MIN_UPDATE_INTERVAL = 30000; // 30 seconds
const SYNC_DELAY = 1000; // 1 second between syncs
const MAX_OFFLINE_RECORDS = 100; // Prevent unlimited storage growth
const MAX_RETRY_ATTEMPTS = 3;

// State management
let lastLocationUpdate = null;
let lastUpdateTime = 0;
let deviceIdCache = null;
let isOnline = true;
let syncInProgress = false;

// Create axios instance with optimized config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// DEVICE MANAGEMENT
// ============================================================================

/**
 * Get or generate a consistent device ID with caching
 */
const getDeviceId = async () => {
  // Return cached value if available
  if (deviceIdCache) {
    return deviceIdCache;
  }

  try {
    let deviceId = await AsyncStorage.getItem('deviceId');
    
    if (!deviceId) {
      // Generate a more reliable device ID
      const uniqueId = Constants.deviceId || 
                       Constants.installationId || 
                       `${Device.modelName || 'Unknown'}-${Date.now()}`;
      deviceId = uniqueId;
      await AsyncStorage.setItem('deviceId', deviceId);
      logger.info('Generated new device ID:', deviceId);
    }
    
    // Cache the device ID
    deviceIdCache = deviceId;
    return deviceId;
  } catch (error) {
    logger.error('Error getting device ID:', error);
    // Return a fallback that's consistent for this session
    if (!deviceIdCache) {
      deviceIdCache = `fallback-${Date.now()}`;
    }
    return deviceIdCache;
  }
};

/**
 * Get device information object (memoized)
 */
const getDeviceInfo = (() => {
  let cachedInfo = null;
  
  return async () => {
    if (cachedInfo) {
      return cachedInfo;
    }
    
    const deviceId = await getDeviceId();
    cachedInfo = {
      deviceId,
      deviceName: Device.deviceName || 'Unknown Device',
      deviceType: Device.osName || 'Unknown OS',
      osVersion: Device.osVersion || 'Unknown Version',
    };
    
    return cachedInfo;
  };
})();

// ============================================================================
// NETWORK MONITORING
// ============================================================================

/**
 * Initialize network state monitoring
 */
const initNetworkMonitoring = () => {
  NetInfo.addEventListener(state => {
    const wasOffline = !isOnline;
    isOnline = state.isConnected;
    
    logger.info(`Network status: ${isOnline ? 'Online' : 'Offline'}`);
    
    // Auto-sync when connection is restored
    if (wasOffline && isOnline && !syncInProgress) {
      logger.info('Connection restored - initiating sync');
      setTimeout(() => syncOfflineData(), 2000); // Give network time to stabilize
    }
  });
};

// Initialize network monitoring
initNetworkMonitoring();

// ============================================================================
// REQUEST/RESPONSE INTERCEPTORS
// ============================================================================

/**
 * Request interceptor - adds auth token and device info
 */
api.interceptors.request.use(
  async (config) => {
    try {
      // Add auth token
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const { token } = JSON.parse(userData);
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add device information headers (optimized with caching)
      const deviceInfo = await getDeviceInfo();
      config.headers['x-device-id'] = deviceInfo.deviceId;
      config.headers['x-device-name'] = deviceInfo.deviceName;
      config.headers['x-device-type'] = deviceInfo.deviceType;
      config.headers['x-os-version'] = deviceInfo.osVersion;
      
      logger.api(`${config.method.toUpperCase()} ${config.url}`, 'From api.js');
      
      return config;
    } catch (error) {
      logger.error('Request interceptor error:', error);
      return config; // Continue with request even if interceptor fails
    }
  },
  (error) => {
    logger.error('Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles errors and auth failures
 */
api.interceptors.response.use(
  (response) => {
    logger.debug(`Response: ${response.config.url} [${response.status}]`);
    return response;
  },
  async (error) => {
    const { config, response } = error;
    
    logger.error('API Error', {
      url: config?.url,
      status: response?.status,
      message: response?.data?.message,
    });
    
    // Handle authentication failures
    if (response?.status === 401 || response?.status === 403) {
      logger.warn('Authentication failed - clearing user data');
      await AsyncStorage.removeItem('userData');
      // You can emit an event here for the app to handle navigation
    }
    
    // Retry logic for network errors (not for 4xx/5xx responses)
    if (!response && config && !config.__retryCount) {
      config.__retryCount = 0;
    }
    
    if (!response && config && config.__retryCount < MAX_RETRY_ATTEMPTS) {
      config.__retryCount += 1;
      const delay = Math.min(1000 * Math.pow(2, config.__retryCount), 5000);
      logger.info(`Retrying request (${config.__retryCount}/${MAX_RETRY_ATTEMPTS}) after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(config);
    }
    
    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH API
// ============================================================================

export const authAPI = {
  login: async (credentials) => {
    logger.api('LOGIN CALL');
    try {
      const response = await api.post('/auth/login', credentials);
      logger.info('Login successful');
      return response.data;
    } catch (error) {
      logger.error('Login error:', error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      await AsyncStorage.removeItem('userData');
      logger.info('Logout successful');
      return response.data;
    } catch (error) {
      logger.error('Logout error:', error);
      // Even if API call fails, clear local data
      await AsyncStorage.removeItem('userData');
      throw error;
    }
  },
};

// ============================================================================
// ATTENDANCE API
// ============================================================================

export const attendanceAPI = {
  markAttendance: async (data) => {
    logger.api('MARK ATTENDANCE REQUEST');
    
    // Check network status first
    if (!isOnline) {
      logger.warn('Offline - storing attendance locally');
      await storeAttendanceOffline(data);
      return { success: true, offline: true };
    }
    
    try {
      const response = await api.post('/attendance/mark', data);
      logger.info('Attendance marked successfully');
      return response.data;
    } catch (error) {
      logger.error('Mark attendance error:', error.response?.data?.message || error.message);
      
      // Store offline if network error
      if (!error.response) {
        await storeAttendanceOffline(data);
      }
      
      throw error;
    }
  },
  
  getCurrentStatus: async () => {
    try {
      const response = await api.get('/attendance/current-status');
      return response.data;
    } catch (error) {
      logger.error('Get current status error:', error);
      throw error;
    }
  },
  
  getHistory: async (params) => {
    logger.api('Fetching attendance history', params);
    try {
      const response = await api.get('/attendance/history', { params });
      return response.data;
    } catch (error) {
      logger.error('Get history error:', error);
      throw error;
    }
  },
};

// ============================================================================
// LOCATION API
// ============================================================================

export const locationAPI = {
  updateLocation: async (locationData) => {
    try {
      // Check network status first
      if (!isOnline) {
        logger.warn('Offline - storing location locally');
        await storeLocationOffline(locationData);
        return { success: true, offline: true };
      }
      
      // Prevent duplicate/rapid updates
      const now = Date.now();
      const isSameLocation = lastLocationUpdate && 
        Math.abs(lastLocationUpdate.latitude - locationData.latitude) < 0.0001 &&
        Math.abs(lastLocationUpdate.longitude - locationData.longitude) < 0.0001;
      
      if (isSameLocation && (now - lastUpdateTime) < MIN_UPDATE_INTERVAL) {
        logger.debug('Skipping duplicate location update');
        return { success: true, skipped: true };
      }

      const response = await api.post('/location/update', locationData);
      
      // Update tracking variables
      lastLocationUpdate = locationData;
      lastUpdateTime = now;
      
      logger.info('Location updated successfully');
      return response.data;
    } catch (error) {
      logger.error('Location update failed - storing offline');
      await storeLocationOffline(locationData);
      throw error;
    }
  },
  
  getLiveLocations: async () => {
    try {
      const response = await api.get('/location/live');
      return response.data;
    } catch (error) {
      logger.error('Get live locations error:', error);
      throw error;
    }
  },
};

// ============================================================================
// OFFLINE STORAGE
// ============================================================================

/**
 * Store location data offline with size limits
 */
const storeLocationOffline = async (locationData) => {
  try {
    const stored = await AsyncStorage.getItem('offlineLocations') || '[]';
    let locations = JSON.parse(stored);
    
    // Add new location
    locations.push({
      ...locationData,
      timestamp: new Date().toISOString(),
      synced: false,
    });
    
    // Limit storage size - keep only recent records
    if (locations.length > MAX_OFFLINE_RECORDS) {
      locations = locations.slice(-MAX_OFFLINE_RECORDS);
      logger.warn(`Trimmed offline locations to ${MAX_OFFLINE_RECORDS} records`);
    }
    
    await AsyncStorage.setItem('offlineLocations', JSON.stringify(locations));
    logger.info('Location stored offline');
  } catch (error) {
    logger.error('Error storing offline location:', error);
  }
};

/**
 * Store attendance data offline with size limits
 */
const storeAttendanceOffline = async (attendanceData) => {
  try {
    const stored = await AsyncStorage.getItem('offlineAttendance') || '[]';
    let attendances = JSON.parse(stored);
    
    // Add new attendance
    attendances.push({
      ...attendanceData,
      timestamp: new Date().toISOString(),
      synced: false,
    });
    
    // Limit storage size
    if (attendances.length > MAX_OFFLINE_RECORDS) {
      attendances = attendances.slice(-MAX_OFFLINE_RECORDS);
      logger.warn(`Trimmed offline attendances to ${MAX_OFFLINE_RECORDS} records`);
    }
    
    await AsyncStorage.setItem('offlineAttendance', JSON.stringify(attendances));
    logger.info('Attendance stored offline');
  } catch (error) {
    logger.error('Error storing offline attendance:', error);
  }
};

// ============================================================================
// OFFLINE SYNC
// ============================================================================

/**
 * Sync offline data when connection is restored
 */
export const syncOfflineData = async () => {
  // Prevent concurrent sync operations
  if (syncInProgress) {
    logger.warn('Sync already in progress - skipping');
    return { success: false, message: 'Sync already in progress' };
  }
  
  // Check network status
  const networkState = await NetInfo.fetch();
  if (!networkState.isConnected) {
    logger.warn('No network - skipping sync');
    return { success: false, message: 'No network connection' };
  }
  
  syncInProgress = true;
  logger.info('Starting offline data sync');
  
  let syncedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  
  try {
    // Sync locations
    const locationResult = await syncLocations();
    syncedCount += locationResult.synced;
    skippedCount += locationResult.skipped;
    failedCount += locationResult.failed;
    
    // Sync attendance
    const attendanceResult = await syncAttendance();
    syncedCount += attendanceResult.synced;
    skippedCount += attendanceResult.skipped;
    failedCount += attendanceResult.failed;
    
    logger.info(`Sync complete - ${syncedCount} synced, ${skippedCount} skipped, ${failedCount} failed`);
    
    return { 
      success: true, 
      syncedCount, 
      skippedCount, 
      failedCount 
    };
  } catch (error) {
    logger.error('Error syncing offline data:', error);
    return { success: false, error: error.message };
  } finally {
    syncInProgress = false;
  }
};

/**
 * Sync offline locations
 */
const syncLocations = async () => {
  let synced = 0;
  let skipped = 0;
  let failed = 0;
  
  try {
    const stored = await AsyncStorage.getItem('offlineLocations');
    if (!stored) return { synced, skipped, failed };
    
    const locationList = JSON.parse(stored);
    const unsyncedLocations = locationList.filter(loc => !loc.synced);
    
    logger.info(`Found ${unsyncedLocations.length} unsynced locations`);
    
    for (const location of unsyncedLocations) {
      try {
        await locationAPI.updateLocation(location);
        location.synced = true;
        synced++;
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, SYNC_DELAY));
      } catch (error) {
        if (error.response?.status === 429) {
          logger.warn('Rate limited - stopping location sync');
          break;
        }
        logger.error('Failed to sync location:', error.message);
        failed++;
      }
    }
    
    // Update storage
    await AsyncStorage.setItem('offlineLocations', JSON.stringify(locationList));
    
    // Clean up old synced records (keep last 10)
    const syncedLocations = locationList.filter(loc => loc.synced);
    if (syncedLocations.length > 10) {
      const remaining = locationList.filter(loc => !loc.synced)
        .concat(syncedLocations.slice(-10));
      await AsyncStorage.setItem('offlineLocations', JSON.stringify(remaining));
    }
  } catch (error) {
    logger.error('Error in syncLocations:', error);
  }
  
  return { synced, skipped, failed };
};

/**
 * Sync offline attendance
 */
const syncAttendance = async () => {
  let synced = 0;
  let skipped = 0;
  let failed = 0;
  
  try {
    const stored = await AsyncStorage.getItem('offlineAttendance');
    if (!stored) return { synced, skipped, failed };
    
    const attendanceList = JSON.parse(stored);
    const unsyncedAttendance = attendanceList.filter(att => !att.synced);
    
    logger.info(`Found ${unsyncedAttendance.length} unsynced attendance records`);
    
    for (const attendance of unsyncedAttendance) {
      try {
        await attendanceAPI.markAttendance(attendance);
        attendance.synced = true;
        synced++;
      } catch (error) {
        // Handle duplicate attendance
        if (error.response?.status === 400 && 
            (error.response?.data?.message?.includes('Already clocked') ||
             error.response?.data?.message?.includes('already'))) {
          logger.warn('Attendance already exists - marking as synced');
          attendance.synced = true;
          skipped++;
        } else {
          logger.error('Failed to sync attendance:', error.message);
          failed++;
        }
      }
    }
    
    // Update storage
    await AsyncStorage.setItem('offlineAttendance', JSON.stringify(attendanceList));
    
    // Clean up old synced records
    const syncedAttendances = attendanceList.filter(att => att.synced);
    if (syncedAttendances.length > 10) {
      const remaining = attendanceList.filter(att => !att.synced)
        .concat(syncedAttendances.slice(-10));
      await AsyncStorage.setItem('offlineAttendance', JSON.stringify(remaining));
    }
  } catch (error) {
    logger.error('Error in syncAttendance:', error);
  }
  
  return { synced, skipped, failed };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Send location update (convenience function)
 */
export const sendLocationUpdate = async (locationData) => {
  try {
    return await locationAPI.updateLocation(locationData);
  } catch (error) {
    logger.error('Error sending location update:', error);
    throw error;
  }
};

/**
 * Send offline status to server
 */
export const sendOfflineStatus = async () => {
  try {
    const response = await api.post('/location/offline');
    return response.data;
  } catch (error) {
    logger.error('Error sending offline status:', error);
    // Silent fail for offline status
    return null;
  }
};

/**
 * Get offline data counts (for debugging/UI)
 */
export const getOfflineDataCounts = async () => {
  try {
    const locations = await AsyncStorage.getItem('offlineLocations') || '[]';
    const attendance = await AsyncStorage.getItem('offlineAttendance') || '[]';
    
    const locationList = JSON.parse(locations);
    const attendanceList = JSON.parse(attendance);
    
    return {
      locations: locationList.filter(l => !l.synced).length,
      attendance: attendanceList.filter(a => !a.synced).length,
      total: locationList.filter(l => !l.synced).length + attendanceList.filter(a => !a.synced).length,
    };
  } catch (error) {
    logger.error('Error getting offline data counts:', error);
    return { locations: 0, attendance: 0, total: 0 };
  }
};

/**
 * Clear all offline data (use with caution)
 */
export const clearOfflineData = async () => {
  try {
    await AsyncStorage.removeItem('offlineLocations');
    await AsyncStorage.removeItem('offlineAttendance');
    logger.info('Offline data cleared');
    return { success: true };
  } catch (error) {
    logger.error('Error clearing offline data:', error);
    return { success: false, error: error.message };
  }
};

export default api;