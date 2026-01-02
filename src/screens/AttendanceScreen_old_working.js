// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   ScrollView,
// } from 'react-native';
// import * as Location from 'expo-location';
// import MapView, { Marker } from 'react-native-maps';
// import { MaterialIcons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import moment from 'moment';
// import { 
//   markAttendance, 
//   getCurrentStatus,
//   syncOfflineData 
// } from '../services/attendanceService';
// import * as Device from 'expo-device';
// import Constants from 'expo-constants';
// import { getDeviceId, getDeviceInfo } from '../utils/deviceHelper';


// export default function AttendanceScreen({ navigation }) {
//   const [isClockedIn, setIsClockedIn] = useState(false);
//   const [currentLocation, setCurrentLocation] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [attendanceRecord, setAttendanceRecord] = useState(null);
//   const [userData, setUserData] = useState(null);


//   // In the component
// const getDeviceId = async () => {
//   let deviceId = await AsyncStorage.getItem('deviceId');
//   if (!deviceId) {
//     deviceId = Constants.deviceId || `${Device.modelName}-${Date.now()}`;
//     await AsyncStorage.setItem('deviceId', deviceId);
//   }
//   return deviceId;
// };


//   // useEffect(() => {
//   //   loadUserData();
//   //   checkCurrentStatus();
//   //   getCurrentPosition();
//   //   syncPendingData();
//   // }, []);

//   useEffect(() => {
//   loadUserData();
//   checkCurrentStatus();
//   getCurrentPosition();
//   // syncPendingData(); // ❌ Remove this or make it conditional
  
//   // ✅ Optional: Only sync if user manually triggers it
//   // or sync after a delay
//   const syncTimer = setTimeout(() => {
//     syncPendingData();
//   }, 5000); // Wait 5 seconds before syncing
  
//   return () => clearTimeout(syncTimer);
// }, []);

//   const loadUserData = async () => {
//     const data = await AsyncStorage.getItem('userData');
//     if (data) {
//       setUserData(JSON.parse(data));
//     }
//   };

//   const checkCurrentStatus = async () => {
//     try {
//       const status = await getCurrentStatus();
//       setIsClockedIn(status.isClockedIn);
//       console.log("Current status:", status);
//       setAttendanceRecord(status.currentRecord);
//     } catch (error) {
//       console.error('Error checking status:', error);
//     }
//   };

//   const getCurrentPosition = async () => {
//     try {
//       const location = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.High,
//       });
//       setCurrentLocation(location);
//     } catch (error) {
//       console.error('Error getting location:', error);
//       Alert.alert('Error', 'Unable to get your location. Please enable location services.');
//     }
//   };

//   const syncPendingData = async () => {
//     await syncOfflineData();
//   };

//   const handleClockIn = async () => {
//     // ✅ Get the actual device ID, not hardcoded
//     const deviceId = await getDeviceId();
//     const deviceInfo = getDeviceInfo();
//     if (!currentLocation) {
//       Alert.alert('Error', 'Unable to get your location. Please try again.');
//       return;
//     }

//     setLoading(true);
//     try {
//       const result = await markAttendance({
//         type: 'clock_in',
//         latitude: currentLocation.coords.latitude,
//         longitude: currentLocation.coords.longitude,
//         timestamp: new Date().toISOString(),
//         address: await getAddressFromCoords(currentLocation),
//         deviceId: deviceId, // You can generate this
//         accuracy: currentLocation.coords.accuracy,
//         batteryLevel: 35, // You can integrate battery level fetching if needed
//         notes: 'Clocking in via mobile app',
//       });

//       console.log("Clock in result:", result);

//       if (result.success) {
//         setIsClockedIn(true);
//         setAttendanceRecord(result.record);
//         Alert.alert('Success', 'Clock in successful!');
//       } else {
//         Alert.alert('Error', result.message || 'Failed to clock in');
//       }
//     } catch (error) {
//       console.error('Error marking attendance:', error);
//       Alert.alert('Error', 'Network error. Attendance saved offline.');
//       // Save attendance locally
//       await saveAttendanceOffline('clock_in');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleClockOut = async () => {
//     const deviceId = await getDeviceId();
//     const deviceInfo = getDeviceInfo();
//     if (!currentLocation) {
//       Alert.alert('Error', 'Unable to get your location. Please try again.');
//       return;
//     }

//     setLoading(true);
//     try {
//       const result = await markAttendance({
//         type: 'clock_out',
//         latitude: currentLocation.coords.latitude,
//         longitude: currentLocation.coords.longitude,
//         timestamp: new Date().toISOString(),
//         address: await getAddressFromCoords(currentLocation),
//         deviceId: deviceId, // You can generate this
//         accuracy: currentLocation.coords.accuracy,
//         batteryLevel: 35, // You can integrate battery level fetching if needed
//         notes: 'Clocking out via mobile app',
//       });
//       console.log("Clock out result:", result);
//       if (result.success) {
//         console.log('Clock out successful:', result);
//         setIsClockedIn(false);
//         Alert.alert('Success', 'Clock out successful!');
//         setAttendanceRecord(null);
//       } else {
//         Alert.alert('Error', result.message || 'Failed to clock out');
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Network error. Attendance saved offline.');
//       await saveAttendanceOffline('clock_out');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getAddressFromCoords = async (location) => {
//     try {
//       const address = await Location.reverseGeocodeAsync({
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude,
//       });
//       return address[0]?.formattedAddress || 'Unknown location';
//     } catch {
//       return 'Unknown location';
//     }
//   };

//   const saveAttendanceOffline = async (type) => {
//     try {
//       const offlineAttendance = await AsyncStorage.getItem('offlineAttendance') || '[]';
//       const attendanceList = JSON.parse(offlineAttendance);
      
//       attendanceList.push({
//         type,
//         latitude: currentLocation.coords.latitude,
//         longitude: currentLocation.coords.longitude,
//         timestamp: new Date().toISOString(),
//         synced: false,
//       });

//       await AsyncStorage.setItem('offlineAttendance', JSON.stringify(attendanceList));
      
//       if (type === 'clock_in') {
//         setIsClockedIn(true);
//       } else {
//         setIsClockedIn(false);
//       }
//     } catch (error) {
//       console.error('Error saving offline:', error);
//     }
//   };

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.welcomeText}>
//           Welcome, {userData?.name || 'Employee'}
//         </Text>
//         <Text style={styles.statusText}>
//           Status: {isClockedIn ? 'On Duty' : 'Off Duty'}
//         </Text>
//       </View>

//       {currentLocation && (
//         <View style={styles.mapContainer}>
//           <MapView
//             style={styles.map}
//             initialRegion={{
//               latitude: currentLocation.coords.latitude,
//               longitude: currentLocation.coords.longitude,
//               latitudeDelta: 0.005,
//               longitudeDelta: 0.005,
//             }}
//           >
//             <Marker
//               coordinate={{
//                 latitude: currentLocation.coords.latitude,
//                 longitude: currentLocation.coords.longitude,
//               }}
//               title="Your Location"
//             />
//           </MapView>
//           <View style={styles.locationInfo}>
//             <MaterialIcons name="location-on" size={20} color="#666" />
//             <Text style={styles.locationText}>
//               Latitude: {currentLocation.coords.latitude.toFixed(6)}
//             </Text>
//             <Text style={styles.locationText}>
//               Longitude: {currentLocation.coords.longitude.toFixed(6)}
//             </Text>
//           </View>
//         </View>
//       )}

//       {attendanceRecord && isClockedIn && (
//         <View style={styles.currentShiftContainer}>
//           <Text style={styles.shiftTitle}>Current Shift</Text>
//           <View style={styles.shiftInfo}>
//             <View style={styles.infoRow}>
//               <MaterialIcons name="schedule" size={18} color="#666" />
//               <Text style={styles.infoText}>
//                 Clock in: {moment(attendanceRecord.clock_in).format('hh:mm A')}
//               </Text>
//             </View>
//             <View style={styles.infoRow}>
//               <MaterialIcons name="location-on" size={18} color="#666" />
//               <Text style={styles.infoText}>
//                 {/* Location: {attendanceRecord.clock_in_location?.substring(0, 30)}... */}
//                 {attendanceRecord.clock_in_location 
//               ? `${attendanceRecord.clock_in_location.substring(0, 30)}...`
//               : 'Location unavailable'}
//               </Text>
//             </View>
//           </View>
//         </View>
//       )}

//       <View style={styles.buttonContainer}>
//         {!isClockedIn ? (
//           <TouchableOpacity
//             style={[styles.button, styles.clockInButton]}
//             onPress={handleClockIn}
//             disabled={loading}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <>
//                 <MaterialIcons name="login" size={24} color="#fff" />
//                 <Text style={styles.buttonText}>Clock In</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity
//             style={[styles.button, styles.clockOutButton]}
//             onPress={handleClockOut}
//             disabled={loading}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <>
//                 <MaterialIcons name="logout" size={24} color="#fff" />
//                 <Text style={styles.buttonText}>Clock Out</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         )}
//       </View>

//       <View style={styles.menuContainer}>
//         <TouchableOpacity
//           style={styles.menuItem}
//           onPress={() => navigation.navigate('History')}
//         >
//           <MaterialIcons name="history" size={24} color="#007AFF" />
//           <Text style={styles.menuText}>Attendance History</Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity
//           style={styles.menuItem}
//           onPress={() => navigation.navigate('Profile')}
//         >
//           <MaterialIcons name="person" size={24} color="#007AFF" />
//           <Text style={styles.menuText}>Profile</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { 
  markAttendance, 
  getCurrentStatus,
  syncOfflineData 
} from '../services/attendanceService';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { getDeviceId, getDeviceInfo } from '../utils/deviceHelper';

export default function AttendanceScreen({ navigation }) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formattedAddress, setFormattedAddress] = useState('Loading location...');

  // Utility function to fetch address from coordinates using OpenStreetMap
  const getAddressFromCoordinates = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      return data.display_name || 'Location not available';
    } catch (error) {
      console.error('Error fetching address:', error);
      return 'Location not available';
    }
  };

  // Get device ID
  const getDeviceIdLocal = async () => {
    let deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = Constants.deviceId || `${Device.modelName}-${Date.now()}`;
      await AsyncStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  useEffect(() => {
    loadUserData();
    checkCurrentStatus();
    getCurrentPosition();
    
    const syncTimer = setTimeout(() => {
      syncPendingData();
    }, 5000);
    
    return () => clearTimeout(syncTimer);
  }, []);

  // Fetch formatted address when attendance record changes
  useEffect(() => {
    const fetchCurrentLocationAddress = async () => {
      if (attendanceRecord?.clockIn?.location?.coordinates) {
        const [lon, lat] = attendanceRecord.clockIn.location.coordinates;
        const address = await getAddressFromCoordinates(lat, lon);
        setFormattedAddress(address);
      }
    };

    if (isClockedIn && attendanceRecord) {
      fetchCurrentLocationAddress();
    }
  }, [attendanceRecord, isClockedIn]);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem('userData');
    if (data) {
      setUserData(JSON.parse(data));
    }
  };

  const checkCurrentStatus = async () => {
    try {
      const status = await getCurrentStatus();
      setIsClockedIn(status.isClockedIn);
      console.log("Current status:", status);
      setAttendanceRecord(status.currentRecord);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const getCurrentPosition = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your location. Please enable location services.');
    }
  };

  const syncPendingData = async () => {
    await syncOfflineData();
  };

  const handleClockIn = async () => {
    const deviceId = await getDeviceIdLocal();
    const deviceInfo = getDeviceInfo();
    
    if (!currentLocation) {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      return;
    }

    setLoading(true);
    try {
      // Fetch address using OpenStreetMap
      const address = await getAddressFromCoordinates(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );

      const result = await markAttendance({
        type: 'clock_in',
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        timestamp: new Date().toISOString(),
        address: address,
        deviceId: deviceId,
        accuracy: currentLocation.coords.accuracy,
        batteryLevel: 35,
        notes: 'Clocking in via mobile app',
      });

      console.log("Clock in result:", result);

      if (result.success) {
        setIsClockedIn(true);
        setAttendanceRecord(result.record);
        setFormattedAddress(address);
        Alert.alert('Success', 'Clock in successful!');
      } else {
        Alert.alert('Error', result.message || 'Failed to clock in');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert('Error', 'Network error. Attendance saved offline.');
      await saveAttendanceOffline('clock_in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    const deviceId = await getDeviceIdLocal();
    const deviceInfo = getDeviceInfo();
    
    if (!currentLocation) {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      return;
    }

    setLoading(true);
    try {
      // Fetch address using OpenStreetMap
      const address = await getAddressFromCoordinates(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );

      const result = await markAttendance({
        type: 'clock_out',
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        timestamp: new Date().toISOString(),
        address: address,
        deviceId: deviceId,
        accuracy: currentLocation.coords.accuracy,
        batteryLevel: 35,
        notes: 'Clocking out via mobile app',
      });

      console.log("Clock out result:", result);

      if (result.success) {
        console.log('Clock out successful:', result);
        setIsClockedIn(false);
        Alert.alert('Success', 'Clock out successful!');
        setAttendanceRecord(null);
        setFormattedAddress('Location not available');
      } else {
        Alert.alert('Error', result.message || 'Failed to clock out');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Attendance saved offline.');
      await saveAttendanceOffline('clock_out');
    } finally {
      setLoading(false);
    }
  };

  const getAddressFromCoords = async (location) => {
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      return address[0]?.formattedAddress || 'Unknown location';
    } catch {
      return 'Unknown location';
    }
  };

  const saveAttendanceOffline = async (type) => {
    try {
      const offlineAttendance = await AsyncStorage.getItem('offlineAttendance') || '[]';
      const attendanceList = JSON.parse(offlineAttendance);
      
      attendanceList.push({
        type,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        timestamp: new Date().toISOString(),
        synced: false,
      });

      await AsyncStorage.setItem('offlineAttendance', JSON.stringify(attendanceList));
      
      if (type === 'clock_in') {
        setIsClockedIn(true);
      } else {
        setIsClockedIn(false);
      }
    } catch (error) {
      console.error('Error saving offline:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {userData?.name || 'Employee'}
        </Text>
        <Text style={styles.statusText}>
          Status: {isClockedIn ? 'On Duty' : 'Off Duty'}
        </Text>
      </View>

      {currentLocation && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker
              coordinate={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
              }}
              title="Your Location"
            />
          </MapView>
          <View style={styles.locationInfo}>
            <MaterialIcons name="location-on" size={20} color="#666" />
            <Text style={styles.locationText}>
              Latitude: {currentLocation.coords.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Longitude: {currentLocation.coords.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      )}

      {attendanceRecord && isClockedIn && (
        <View style={styles.currentShiftContainer}>
          <Text style={styles.shiftTitle}>Current Shift</Text>
          <View style={styles.shiftInfo}>
            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={18} color="#666" />
              <Text style={styles.infoText}>
                Clock in: {moment(attendanceRecord.clockIn?.time || attendanceRecord.clock_in).format('hh:mm A')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={18} color="#666" />
              <Text style={styles.infoText} numberOfLines={2}>
                {formattedAddress}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!isClockedIn ? (
          <TouchableOpacity
            style={[styles.button, styles.clockInButton]}
            onPress={handleClockIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="login" size={24} color="#fff" />
                <Text style={styles.buttonText}>Clock In</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.clockOutButton]}
            onPress={handleClockOut}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="logout" size={24} color="#fff" />
                <Text style={styles.buttonText}>Clock Out</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('History')}
        >
          <MaterialIcons name="history" size={24} color="#007AFF" />
          <Text style={styles.menuText}>Attendance History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <MaterialIcons name="person" size={24} color="#007AFF" />
          <Text style={styles.menuText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 5,
    opacity: 0.9,
  },
  mapContainer: {
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
  },
  map: {
    height: 200,
    width: '100%',
  },
  locationInfo: {
    padding: 10,
    backgroundColor: '#fff',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  currentShiftContainer: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
  },
  shiftTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  shiftInfo: {
    paddingLeft: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 10,
    color: '#666',
  },
  buttonContainer: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    width: '80%',
  },
  clockInButton: {
    backgroundColor: '#4CAF50',
  },
  clockOutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  menuText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },


    mapContainer: {
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: 200,
  },
  locationInfo: {
    backgroundColor: '#fff',
    padding: 10,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 25,
  },
});