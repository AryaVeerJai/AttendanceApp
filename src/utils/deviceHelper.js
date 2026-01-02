import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';

export const getDeviceId = async () => {
  try {
    // Try to get existing device ID
    let deviceId = await AsyncStorage.getItem('deviceId');
    
    if (!deviceId) {
      // Generate new device ID using device-specific info
      const uniqueId = Constants.deviceId || 
                       `${Device.modelName || 'Unknown'}-${Date.now()}`;
      deviceId = uniqueId;
      await AsyncStorage.setItem('deviceId', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback
    return `fallback-${Date.now()}`;
  }
};

export const getDeviceInfo = () => {
  return {
    deviceName: Device.deviceName || 'Unknown Device',
    deviceType: Device.osName || 'Unknown OS',
    osVersion: Device.osVersion || 'Unknown Version',
  };
};

const getBatteryLevel = async () => {
  try {
    const level = await Battery.getBatteryLevelAsync();

    if (level === null) {
      return null;
    }

    // level is between 0 and 1 → convert to %
    return Math.round(level * 100);
  } catch (error) {
    console.log('Battery error:', error);
    return null;
  }
};