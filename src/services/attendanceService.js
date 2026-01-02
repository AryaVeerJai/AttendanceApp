// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { attendanceAPI, locationAPI, syncOfflineData } from './api';
// import NetInfo from '@react-native-community/netinfo';

// export const attendanceService = {
//   // Mark attendance (clock in/out)
//   markAttendance: async (data) => {
//     console.log("Marking attendance with data:", data);
//     try {
//       const networkState = await NetInfo.fetch();
//       console.log("Network state:", networkState);
      
//       if (!networkState.isConnected) {
//         console.log("No internet connection. Storing attendance offline.");
//         // Store attendance offline
//         await storeAttendanceOffline(data);
//         return {
//           success: true,
//           offline: true,
//           message: 'Attendance saved offline. Will sync when connected.',
//           record: createOfflineRecord(data),
//         };
//       }

//       // Online - send to server
//       const response = await attendanceAPI.markAttendance(data);

//       console.log("Attendance marked successfully:", response);
      
//       if (response.success) {
//         // Clear any pending offline records for today
//         await clearPendingAttendanceForToday();
//       }
      
//       return response;
//     } catch (error) {
//       console.error('Error marking attendance: 35', error);
      
//       // Save offline on error
//       await storeAttendanceOffline(data);
      
//       return {
//         success: true,
//         offline: true,
//         message: 'Saved offline due to network error.',
//         record: createOfflineRecord(data),
//       };
//     }
//   },

//   // Get current attendance status
//   getCurrentStatus: async () => {
//     console.log("Fetching current attendance status");
//     try {
//       const userData = await AsyncStorage.getItem('userData');
//       console.log("User data from storage:", userData);
//       if (!userData) {
//         console.log('No user data found in storage');
//         return { isClockedIn: false, currentRecord: null };
//       }

//       const { employeeId } = JSON.parse(userData);
      
//       // First check if we have an offline clock in
//       const offlineAttendance = await AsyncStorage.getItem('offlineAttendance') || '[]';
//       console.log("Offline attendance data:", offlineAttendance);
//       const attendanceList = JSON.parse(offlineAttendance);
      
//       const today = new Date().toISOString().split('T')[0];
//       // console.log("Today's date:", today);
//       const offlineClockIn = attendanceList.find(record => 
//         !record.synced && 
//         record.type === 'clock_in' && 
//         record.timestamp.split('T')[0] === today
//       );

//       console.log("Offline clock in record:", offlineClockIn);

//       if (offlineClockIn) {
//         return {
//           isClockedIn: true,
//           currentRecord: {
//             clock_in: offlineClockIn.timestamp,
//             clock_in_location: 'Offline - Pending sync',
//           },
//         };
//       }

//       // Check online status
//       const networkState = await NetInfo.fetch();
//       if (networkState.isConnected) {
//         const response = await attendanceAPI.getCurrentStatus();
//         return response;
//       }

//       // No internet and no offline clock in
//       return { isClockedIn: false, currentRecord: null };
//     } catch (error) {
//       console.error('Error getting current status:', error);
//       return { isClockedIn: false, currentRecord: null };
//     }
//   },

//   // Get attendance history
//   getHistory: async (params) => {
//     try {
//       const networkState = await NetInfo.fetch();
      
//       if (!networkState.isConnected) {
//         // Return offline history
//         return getOfflineHistory(params);
//       }

//       // Get from server
//       const response = await attendanceAPI.getHistory(params);
//       return response;
//     } catch (error) {
//       console.error('Error getting history:', error);
//       // Fallback to offline history
//       return getOfflineHistory(params);
//     }
//   },

//   // Get today's attendance summary
//   getTodaySummary: async () => {
//     try {
//       const today = new Date().toISOString().split('T')[0];
      
//       // Get all records for today
//       const offlineAttendance = await AsyncStorage.getItem('offlineAttendance') || '[]';
//       const attendanceList = JSON.parse(offlineAttendance);
      
//       const todayRecords = attendanceList.filter(record => 
//         record.timestamp.split('T')[0] === today
//       );

//       let clockIn = null;
//       let clockOut = null;
      
//       todayRecords.forEach(record => {
//         if (record.type === 'clock_in') {
//           clockIn = record.timestamp;
//         } else if (record.type === 'clock_out') {
//           clockOut = record.timestamp;
//         }
//       });

//       return {
//         clockIn,
//         clockOut,
//         totalRecords: todayRecords.length,
//         pendingSync: todayRecords.filter(r => !r.synced).length,
//       };
//     } catch (error) {
//       console.error('Error getting today summary:', error);
//       return { clockIn: null, clockOut: null, totalRecords: 0, pendingSync: 0 };
//     }
//   },

//   // Clear all attendance data
//   clearAllData: async () => {
//     try {
//       await AsyncStorage.removeItem('offlineAttendance');
//       return { success: true };
//     } catch (error) {
//       console.error('Error clearing attendance data:', error);
//       return { success: false, error: error.message };
//     }
//   },
// };

// // Helper functions
// const storeAttendanceOffline = async (data) => {
//   try {
//     const stored = await AsyncStorage.getItem('offlineAttendance') || '[]';
//     const attendanceList = JSON.parse(stored);
    
//     attendanceList.push({
//       ...data,
//       id: Date.now().toString(),
//       synced: false,
//       createdAt: new Date().toISOString(),
//     });

//     await AsyncStorage.setItem('offlineAttendance', JSON.stringify(attendanceList));
//   } catch (error) {
//     console.error('Error storing attendance offline:', error);
//     throw error;
//   }
// };

// const createOfflineRecord = (data) => {
//   return {
//     clock_in: data.type === 'clock_in' ? data.timestamp : null,
//     clock_out: data.type === 'clock_out' ? data.timestamp : null,
//     clock_in_location: data.address || 'Location pending sync',
//     clock_out_location: data.type === 'clock_out' ? data.address : null,
//     is_offline: true,
//     sync_pending: true,
//   };
// };

// const clearPendingAttendanceForToday = async () => {
//   try {
//     const today = new Date().toISOString().split('T')[0];
//     const stored = await AsyncStorage.getItem('offlineAttendance') || '[]';
//     let attendanceList = JSON.parse(stored);
    
//     // Mark today's records as synced
//     attendanceList = attendanceList.map(record => {
//       if (record.timestamp.split('T')[0] === today) {
//         return { ...record, synced: true };
//       }
//       return record;
//     });

//     await AsyncStorage.setItem('offlineAttendance', JSON.stringify(attendanceList));
//   } catch (error) {
//     console.error('Error clearing pending attendance:', error);
//   }
// };

// const getOfflineHistory = async (params) => {
//   try {
//     const stored = await AsyncStorage.getItem('offlineAttendance') || '[]';
//     let attendanceList = JSON.parse(stored);

//     // Filter by date if provided
//     if (params.startDate) {
//       attendanceList = attendanceList.filter(record =>
//         new Date(record.timestamp) >= new Date(params.startDate)
//       );
//     }
    
//     if (params.endDate) {
//       attendanceList = attendanceList.filter(record =>
//         new Date(record.timestamp) <= new Date(params.endDate)
//       );
//     }

//     // Group by date and convert to record format
//     const grouped = {};
//     attendanceList.forEach(record => {
//       const date = record.timestamp.split('T')[0];
//       if (!grouped[date]) {
//         grouped[date] = {
//           date,
//           clock_in: null,
//           clock_out: null,
//           clock_in_location: null,
//           clock_out_location: null,
//           records: [],
//         };
//       }
      
//       if (record.type === 'clock_in') {
//         grouped[date].clock_in = record.timestamp;
//         grouped[date].clock_in_location = record.address || 'Offline location';
//       } else if (record.type === 'clock_out') {
//         grouped[date].clock_out = record.timestamp;
//         grouped[date].clock_out_location = record.address || 'Offline location';
//       }
      
//       grouped[date].records.push(record);
//     });

//     const history = Object.values(grouped)
//       .sort((a, b) => new Date(b.date) - new Date(a.date))
//       .slice(0, params?.limit || 30);

//     return {
//       success: true,
//       data: history,
//       offline: true,
//       message: 'Showing offline records. Connect to internet for complete history.',
//     };
//   } catch (error) {
//     console.error('Error getting offline history:', error);
//     return {
//       success: false,
//       data: [],
//       error: 'Failed to load offline history',
//     };
//   }
// };

// // Export individual functions
// export const markAttendance = attendanceService.markAttendance;
// export const getCurrentStatus = attendanceService.getCurrentStatus;
// export const getHistory = attendanceService.getHistory;
// export const getTodaySummary = attendanceService.getTodaySummary;
// export const clearAttendanceData = attendanceService.clearAllData;



import AsyncStorage from '@react-native-async-storage/async-storage';
import { attendanceAPI, locationAPI, syncOfflineData } from './api';
import NetInfo from '@react-native-community/netinfo';

export const attendanceService = {
  // Mark attendance (clock in/out)
  markAttendance: async (data) => {
    // console.log("Marking attendance with data:", data);
    try {
      const networkState = await NetInfo.fetch();
      // console.log("Network state:", networkState);
      
      if (!networkState.isConnected) {
        console.log("No internet connection. Storing attendance offline.");
        await storeAttendanceOffline(data);
        return {
          success: true,
          offline: true,
          message: 'Attendance saved offline. Will sync when connected.',
          record: createOfflineRecord(data),
        };
      }

      // Online - send to server
      const response = await attendanceAPI.markAttendance(data);
      // console.log("Attendance marked successfully:", response);
      
      // Fix: Backend returns { status: 'success', data: { attendance } }
      if (response.status === 'success') {
        await clearPendingAttendanceForToday();
        return {
          success: true,
          record: response.data.attendance,
          message: response.message,
        };
      }
      
      // If not successful
      return {
        success: false,
        message: response.message || 'Failed to mark attendance',
      };
    } catch (error) {
      console.error('Error marking attendance:', error);
      
      // Save offline on error
      await storeAttendanceOffline(data);
      
      return {
        success: true,
        offline: true,
        message: 'Saved offline due to network error.',
        record: createOfflineRecord(data),
      };
    }
  },

  // Get current attendance status
  getCurrentStatus: async () => {
    console.log("Fetching current attendance status");
    try {
      const userData = await AsyncStorage.getItem('userData');
      // console.log("User data from storage:", userData);
      
      if (!userData) {
        // console.log('No user data found in storage');
        return { isClockedIn: false, currentRecord: null };
      }

      const { employeeId } = JSON.parse(userData);
      
      // First check if we have an offline clock in
      const offlineAttendance = await AsyncStorage.getItem('offlineAttendance') || '[]';
      const attendanceList = JSON.parse(offlineAttendance);
      
      const today = new Date().toISOString().split('T')[0];
      const offlineClockIn = attendanceList.find(record => 
        !record.synced && 
        record.type === 'clock_in' && 
        record.timestamp.split('T')[0] === today
      );

      if (offlineClockIn) {
        // console.log("Found offline clock in:", offlineClockIn);
        return {
          isClockedIn: true,
          currentRecord: {
            clock_in: offlineClockIn.timestamp,
            clock_in_location: 'Offline - Pending sync',
          },
        };
      }

      // Check online status
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        const response = await attendanceAPI.getCurrentStatus();
        
        // Fix: Handle backend response structure
        if (response.status === 'success' && response.data) {
          // console.log("Online current status:", response.data);
          return {
            isClockedIn: response.data.isClockedIn || false,
            currentRecord: response.data.currentRecord || null,
          };
        }
      }

      return { isClockedIn: false, currentRecord: null };
    } catch (error) {
      console.error('Error getting current status:', error);
      return { isClockedIn: false, currentRecord: null };
    }
  },

  // Get attendance history
  getHistory: async (params) => {
    try {
      const networkState = await NetInfo.fetch();
      
      if (!networkState.isConnected) {
        return getOfflineHistory(params);
      }

      const response = await attendanceAPI.getHistory(params);
      
      // Fix: Handle backend response
      if (response.status === 'success') {
        return {
          success: true,
          data: response.data.attendance || [],
        };
      }
      
      return getOfflineHistory(params);
    } catch (error) {
      console.error('Error getting history:', error);
      return getOfflineHistory(params);
    }
  },

  // Get today's attendance summary
  getTodaySummary: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const offlineAttendance = await AsyncStorage.getItem('offlineAttendance') || '[]';
      const attendanceList = JSON.parse(offlineAttendance);
      
      const todayRecords = attendanceList.filter(record => 
        record.timestamp.split('T')[0] === today
      );

      let clockIn = null;
      let clockOut = null;
      
      todayRecords.forEach(record => {
        if (record.type === 'clock_in') {
          clockIn = record.timestamp;
        } else if (record.type === 'clock_out') {
          clockOut = record.timestamp;
        }
      });

      return {
        clockIn,
        clockOut,
        totalRecords: todayRecords.length,
        pendingSync: todayRecords.filter(r => !r.synced).length,
      };
    } catch (error) {
      console.error('Error getting today summary:', error);
      return { clockIn: null, clockOut: null, totalRecords: 0, pendingSync: 0 };
    }
  },

  clearAllData: async () => {
    try {
      await AsyncStorage.removeItem('offlineAttendance');
      return { success: true };
    } catch (error) {
      console.error('Error clearing attendance data:', error);
      return { success: false, error: error.message };
    }
  },
};

// Helper functions
const storeAttendanceOffline = async (data) => {
  try {
    const stored = await AsyncStorage.getItem('offlineAttendance') || '[]';
    const attendanceList = JSON.parse(stored);
    
    attendanceList.push({
      ...data,
      id: Date.now().toString(),
      synced: false,
      createdAt: new Date().toISOString(),
    });

    await AsyncStorage.setItem('offlineAttendance', JSON.stringify(attendanceList));
  } catch (error) {
    console.error('Error storing attendance offline:', error);
    throw error;
  }
};

const createOfflineRecord = (data) => {
  return {
    clock_in: data.type === 'clock_in' ? data.timestamp : null,
    clock_out: data.type === 'clock_out' ? data.timestamp : null,
    clock_in_location: data.address || 'Location pending sync',
    clock_out_location: data.type === 'clock_out' ? data.address : null,
    is_offline: true,
    sync_pending: true,
  };
};

const clearPendingAttendanceForToday = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const stored = await AsyncStorage.getItem('offlineAttendance') || '[]';
    let attendanceList = JSON.parse(stored);
    
    attendanceList = attendanceList.map(record => {
      if (record.timestamp.split('T')[0] === today) {
        return { ...record, synced: true };
      }
      return record;
    });

    await AsyncStorage.setItem('offlineAttendance', JSON.stringify(attendanceList));
  } catch (error) {
    console.error('Error clearing pending attendance:', error);
  }
};

const getOfflineHistory = async (params) => {
  try {
    const stored = await AsyncStorage.getItem('offlineAttendance') || '[]';
    let attendanceList = JSON.parse(stored);

    if (params?.startDate) {
      attendanceList = attendanceList.filter(record =>
        new Date(record.timestamp) >= new Date(params.startDate)
      );
    }
    
    if (params?.endDate) {
      attendanceList = attendanceList.filter(record =>
        new Date(record.timestamp) <= new Date(params.endDate)
      );
    }

    const grouped = {};
    attendanceList.forEach(record => {
      const date = record.timestamp.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = {
          date,
          clock_in: null,
          clock_out: null,
          clock_in_location: null,
          clock_out_location: null,
          records: [],
        };
      }
      
      if (record.type === 'clock_in') {
        grouped[date].clock_in = record.timestamp;
        grouped[date].clock_in_location = record.address || 'Offline location';
      } else if (record.type === 'clock_out') {
        grouped[date].clock_out = record.timestamp;
        grouped[date].clock_out_location = record.address || 'Offline location';
      }
      
      grouped[date].records.push(record);
    });

    const history = Object.values(grouped)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, params?.limit || 30);

    return {
      success: true,
      data: history,
      offline: true,
      message: 'Showing offline records. Connect to internet for complete history.',
    };
  } catch (error) {
    console.error('Error getting offline history:', error);
    return {
      success: false,
      data: [],
      error: 'Failed to load offline history',
    };
  }
};

export const markAttendance = attendanceService.markAttendance;
export const getCurrentStatus = attendanceService.getCurrentStatus;
export const getHistory = attendanceService.getHistory;
export const getTodaySummary = attendanceService.getTodaySummary;
export const clearAttendanceData = attendanceService.clearAllData;
export { syncOfflineData } from './api';