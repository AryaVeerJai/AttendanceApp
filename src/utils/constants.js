export const API_BASE_URL = 'https://your-backend-api.com/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  
  // Attendance endpoints
  MARK_ATTENDANCE: '/attendance/mark',
  CURRENT_STATUS: '/attendance/current-status',
  ATTENDANCE_HISTORY: '/attendance/history',
  TODAY_SUMMARY: '/attendance/today-summary',
  
  // Location endpoints
  UPDATE_LOCATION: '/location/update',
  LIVE_LOCATIONS: '/location/live',
  LOCATION_HISTORY: '/location/history',
  
  // Employee endpoints
  EMPLOYEE_PROFILE: '/employee/profile',
  UPDATE_PROFILE: '/employee/update-profile',
  LIVE_EMPLOYEES: '/employee/live-status',
  
  // Admin endpoints (if needed for employee app)
  TEAM_ATTENDANCE: '/admin/team-attendance',
  TEAM_LOCATIONS: '/admin/team-locations',
};

export const STORAGE_KEYS = {
  USER_DATA: 'userData',
  OFFLINE_LOCATIONS: 'offlineLocations',
  OFFLINE_ATTENDANCE: 'offlineAttendance',
  LOCATION_HISTORY: 'locationHistory',
  APP_SETTINGS: 'appSettings',
  REMEMBERED_EMAIL: 'rememberedEmail',
  SESSION_TOKEN: 'sessionToken',
  DEVICE_ID: 'deviceId',
};

export const APP_SETTINGS = {
  LOCATION_UPDATE_INTERVAL: 30000, // 30 seconds
  BACKGROUND_LOCATION_INTERVAL: 60000, // 1 minute
  MAX_OFFLINE_STORAGE_DAYS: 30,
  MAX_LOCATION_HISTORY: 5000,
  MAX_OFFLINE_LOCATIONS: 1000,
  AUTO_SYNC_INTERVAL: 300000, // 5 minutes
};

export const ATTENDANCE_STATUS = {
  CLOCKED_IN: 'clocked_in',
  CLOCKED_OUT: 'clocked_out',
  ON_BREAK: 'on_break',
  OFFLINE: 'offline',
  PENDING_SYNC: 'pending_sync',
};

export const LOCATION_ACCURACY = {
  HIGH: 'high',
  BALANCED: 'balanced',
  LOW: 'low',
  LOW_POWER: 'low_power',
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  LOCATION_ERROR: 'Unable to access location. Please enable location services.',
  PERMISSION_ERROR: 'Permission denied. Please grant required permissions in settings.',
  SERVER_ERROR: 'Server error. Please try again later.',
  SESSION_EXPIRED: 'Session expired. Please login again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  OFFLINE_MODE: 'Working in offline mode. Data will sync when connected.',
};

export const SUCCESS_MESSAGES = {
  CLOCK_IN_SUCCESS: 'Clock in successful!',
  CLOCK_OUT_SUCCESS: 'Clock out successful!',
  LOCATION_UPDATED: 'Location updated successfully',
  SYNC_COMPLETE: 'Sync completed successfully',
  DATA_SAVED_OFFLINE: 'Data saved offline. Will sync when connected.',
};

export const COLORS = {
  PRIMARY: '#007AFF',
  PRIMARY_DARK: '#0056CC',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#FF3B30',
  INFO: '#2196F3',
  BACKGROUND: '#F5F5F5',
  CARD_BACKGROUND: '#FFFFFF',
  TEXT_PRIMARY: '#2C3E50',
  TEXT_SECONDARY: '#7F8C8D',
  TEXT_LIGHT: '#95A5A6',
  BORDER: '#E0E0E0',
  SHADOW: 'rgba(0, 0, 0, 0.1)',
};

export const FONTS = {
  REGULAR: 'System',
  MEDIUM: 'System',
  BOLD: 'System',
  // For custom fonts, you would define them here
  // REGULAR: 'Roboto-Regular',
  // MEDIUM: 'Roboto-Medium',
  // BOLD: 'Roboto-Bold',
};

export const ICONS = {
  CLOCK_IN: 'login',
  CLOCK_OUT: 'logout',
  LOCATION: 'location-on',
  HISTORY: 'history',
  PROFILE: 'person',
  SETTINGS: 'settings',
  REFRESH: 'refresh',
  SYNC: 'sync',
  OFFLINE: 'cloud-off',
  ONLINE: 'cloud-queue',
  MAP: 'map',
  CALENDAR: 'calendar-today',
  TIMER: 'timer',
  ARROW_RIGHT: 'chevron-right',
  CHECK: 'check-circle',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
  MENU: 'menu',
  BACK: 'arrow-back',
  CLOSE: 'close',
  SEARCH: 'search',
  FILTER: 'filter-list',
  SORT: 'sort',
  DOWNLOAD: 'file-download',
  UPLOAD: 'file-upload',
  DELETE: 'delete',
  EDIT: 'edit',
  SAVE: 'save',
  CANCEL: 'cancel',
  ADD: 'add',
  REMOVE: 'remove',
  VISIBILITY: 'visibility',
  VISIBILITY_OFF: 'visibility-off',
  NOTIFICATIONS: 'notifications',
  NOTIFICATIONS_OFF: 'notifications-off',
  BATTERY: 'battery-full',
  NETWORK: 'network-check',
  GPS: 'gps-fixed',
  GPS_OFF: 'gps-off',
};

export const MAP_SETTINGS = {
  INITIAL_REGION: {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  DEFAULT_ZOOM: 15,
  MARKER_SIZE: 40,
  TRACKING_PADDING: { top: 100, right: 50, bottom: 50, left: 50 },
};

export const NOTIFICATION_TYPES = {
  ATTENDANCE_REMINDER: 'attendance_reminder',
  SHIFT_START: 'shift_start',
  SHIFT_END: 'shift_end',
  LOCATION_ALERT: 'location_alert',
  SYNC_COMPLETE: 'sync_complete',
  OFFLINE_MODE: 'offline_mode',
};

export const TIME_FORMATS = {
  DISPLAY_TIME: 'hh:mm A',
  DISPLAY_DATE: 'MMM DD, YYYY',
  DISPLAY_DATETIME: 'MMM DD, YYYY hh:mm A',
  API_DATE: 'YYYY-MM-DD',
  API_DATETIME: 'YYYY-MM-DDTHH:mm:ssZ',
  DURATION: 'HH:mm',
};

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  LOCATION_ACCURACY_THRESHOLD: 100, // meters
  MIN_WORK_HOURS: 1, // minimum hours for valid shift
  MAX_WORK_HOURS: 16, // maximum hours for valid shift
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  STORAGE_KEYS,
  APP_SETTINGS,
  ATTENDANCE_STATUS,
  LOCATION_ACCURACY,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  COLORS,
  FONTS,
  ICONS,
  MAP_SETTINGS,
  NOTIFICATION_TYPES,
  TIME_FORMATS,
  VALIDATION_RULES,
};