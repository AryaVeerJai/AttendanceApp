// Toggle this for development vs production
const __DEV__ = true; // Set to false for production builds

// Log levels
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

class Logger {
  constructor(enableLogs = __DEV__) {
    this.enableLogs = enableLogs;
  }

  error(message, ...args) {
    // Always log errors, even in production
    console.error('❌', message, ...args);
  }

  warn(message, ...args) {
    if (this.enableLogs) {
      console.warn('⚠️', message, ...args);
    }
  }

  info(message, ...args) {
    if (this.enableLogs) {
      console.log('ℹ️ ', message, ...args);
    }
  }

  debug(message, ...args) {
    if (this.enableLogs) {
      console.log('🔍', message, ...args);
    }
  }

  // Special logs for specific features
  location(message, data) {
    if (this.enableLogs) {
      console.log('📍', message, data);
    }
  }

  api(message, data) {
    if (this.enableLogs) {
      console.log('🌐', message, data);
    }
  }

  background(message, data) {
    if (this.enableLogs) {
      console.log('🔔', message, data);
    }
  }
}

export default new Logger(__DEV__);