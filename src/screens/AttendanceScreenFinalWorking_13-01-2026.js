import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Pressable,
  Linking,
  Platform,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
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
import * as Notifications from 'expo-notifications';
import { FullScreenLoader } from '../components/FullScreenLoader';
import { SpinnerLoader } from '../components/Loaders';

export default function AttendanceScreen({ navigation }) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isClockedOut, setIsClockedOut] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formattedAddress, setFormattedAddress] = useState('Loading location...');
  const [clockOutNote, setClockOutNote] = useState('');


// Update the getAddressFromCoordinates function with proper headers and error handling
const getAddressFromCoordinates = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          'User-Agent': 'AttendanceApp/1.0 (jai.webshark@gmail.com)', // Required by Nominatim
          // 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', // Required by Nominatim
        },
      }
    );
    
    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      // Fallback to a simpler address format
      return `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    }
    
    const data = await response.json();
    return data.display_name || `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
  } catch (error) {
    console.error('Error fetching address:', error);
    // Return coordinates as fallback
    return `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
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
        const [lon, lat] = attendanceRecord?.clockIn?.location?.coordinates;
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
    setLoading(true)
    try {
      const status = await getCurrentStatus();
      setIsClockedIn(status?.isClockedIn);
      setIsClockedOut(status?.isClockedOut);
      // console.log("Current status:", status);
      setAttendanceRecord(status?.currentRecord);
    setLoading(false)
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const getCurrentPosition = async () => {
    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your location. Please enable location services.');
    }
    setLoading(false);
  };

  const syncPendingData = async () => {
    await syncOfflineData();
  };


  const handleClockIn = async () => {
  Alert.alert(
    'Confirm Clock In',
    'Are you sure you want to clock in?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Clock In',
        style: 'destructive',
        onPress: async () => {
          const deviceId = await getDeviceIdLocal();
          const deviceInfo = getDeviceInfo();

          if (!currentLocation) {
            Alert.alert('Error', 'Unable to get your location. Please try again.');
            return;
          }

          const { latitude, longitude, accuracy } = currentLocation.coords;

          setLoading(true);
          try {
            // 🔹 Reverse geocoding (Nominatim)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              {
                headers: {
                  'User-Agent': 'AttendanceApp/1.0 (jai.webshark@gmail.com)',
                },
              }
            );

            if (!response.ok) {
              throw new Error('Failed to fetch address');
            }

            const locationData = await response.json();
            const address = locationData.display_name || 'Address not available';

            // 🔹 Send to backend
            const result = await markAttendance({
              type: 'clock_in',
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
              address,
              accuracy,
              deviceId,
              batteryLevel: 35,
              notes: 'Clocking in via mobile app',
            });

            if (result.success) {
              setIsClockedIn(true);
              setAttendanceRecord(result.record);
              setFormattedAddress(address);
              Alert.alert('Success', 'Clock in successful!');
            } 
            else if (result.status === 'already_clocked_in') {
              setIsClockedIn(true);
              Alert.alert('Success', 'Clock in successful!');
              // Alert.alert('Info', 'You are already clocked in for today.');
            } 
            else {
              Alert.alert('Error', result.message || 'Failed to clock in');
            }
          } catch (error) {
            console.error('Clock in error:', error);
            Alert.alert('Offline', 'Network error. Attendance saved offline.');
            await saveAttendanceOffline('clock_in');
          } finally {
            setLoading(false);
          }
        },
      },
    ],
    { cancelable: true }
  );
};

// console.log(attendanceRecord.clockIn.address)


const handleClockOut = async () => {
    if (!clockOutNote) {
      // console.log(clockOutNote)
    Alert.alert(
      'Clock out Note Required!',
      'Please enter clock out note before clock out.'
    );
    return; // ✅ stop here
  }
  Alert.alert(
    'Confirm Clock Out',
    'Are you sure you want to clock out?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Clock Out',
        style: 'destructive',
        onPress: async () => {
          const deviceId = await getDeviceIdLocal();
          const deviceInfo = getDeviceInfo();

          if (!currentLocation) {
            Alert.alert('Error', 'Unable to get your location. Please try again.');
            return;
          }

          const { latitude, longitude, accuracy } = currentLocation.coords;

          setLoading(true);
          try {
            const address = await getAddressFromCoordinates(latitude, longitude);

            const result = await markAttendance({
              type: 'clock_out',
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
              address,
              accuracy,
              deviceId,
              batteryLevel: 35,
              notes: clockOutNote,
            });

            if (result.success) {
              setIsClockedIn(false);
              setAttendanceRecord(null);
              setFormattedAddress('Location not available');
              checkCurrentStatus();
              Alert.alert('Success', 'Clock out successful!');
            } 
            else if (result.status === 'not_clocked_in') {
              Alert.alert('Info', 'You are not clocked in today.');
            } 
            else {
              Alert.alert('Error', result.message || 'Failed to clock out');
            }
          } catch (error) {
            console.error('Clock out error:', error);
            Alert.alert('Offline', 'Network error. Attendance saved offline.');
            await saveAttendanceOffline('clock_out');
          } finally {
            setLoading(false);
          }
        },
      },
    ],
    { cancelable: true }
  );
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

  const openInGoogleMaps = (lat, lng) => {
  const url = Platform.select({
    ios: `http://maps.apple.com/?ll=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}`,
  });

  Linking.openURL(url).catch(err =>
    console.error('Failed to open map:', err)
  );
};

  if (loading) {
    return <SpinnerLoader text="Loading attendance..." color="#4CAF50" />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* <FullScreenLoader visible={loading} text="Syncing data..." /> */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {userData?.name || "Employee"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between"}}>
          <View>
            <Text style={styles.statusText}>
              Status: {isClockedIn ? "On Duty" : "Off Duty"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => checkCurrentStatus()}
            // disabled={refreshing}
          >
            <MaterialIcons
              name="refresh"
              size={24}
              color="#ffffff"
              // style={refreshing && styles.refreshingIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {currentLocation && (
        <Pressable
          onPress={() =>
            openInGoogleMaps(
              currentLocation.coords.latitude,
              currentLocation.coords.longitude
            )
          }
          style={styles.locationInfo}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 10
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="location-on" size={20} color="#666" />
              <View>
                <Text style={styles.locationText}>
                  Latitude: {currentLocation.coords.latitude.toFixed(6)}
                </Text>

                <Text style={styles.locationText}>
                  Longitude: {currentLocation.coords.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.locationText}>Open in Maps </Text>
              <MaterialIcons name="directions" size={20} color="#666" />
            </View>
          </View>
        </Pressable>
      )}

      {attendanceRecord && isClockedIn && (
        <View style={styles.currentShiftContainer}>
          <Text style={styles.shiftTitle}>Current Shift</Text>
          <View style={styles.shiftInfo}>
            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={18} color="#666" />
              <Text style={styles.infoText}>
                Clock in:{" "}
                {moment(
                  attendanceRecord?.clockIn?.time || attendanceRecord?.clock_in
                ).format("hh:mm A")}
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

      {isClockedOut && (
        <View style={styles.currentShiftContainer}>
          <Text style={styles.shiftTitle}>Current Shift</Text>
          <View style={styles.shiftInfo}>
            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={18} color="#666" />
              <Text style={styles.infoText}>
                Clock in:{" "}
                {moment(
                  attendanceRecord?.clockIn?.time || attendanceRecord?.clock_in
                ).format("hh:mm A")}
              </Text>
              <Text style={styles.infoText}>
                Clock out:{" "}
                {moment(
                  attendanceRecord?.clockOut?.time ||
                    attendanceRecord?.clock_out
                ).format("hh:mm A")}
              </Text>
            </View>
            {attendanceRecord?.clockIn?.address && (
              <View style={styles.infoRow}>
                <MaterialIcons name="location-on" size={18} color="#666" />
                <Text style={styles.infoText} numberOfLines={2}>
                  {/* {formattedAddress} */}
                  {attendanceRecord?.clockIn?.address}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!isClockedIn && !isClockedOut ? (
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
        ) : !isClockedOut ? (
          <>
            <View style={styles.textInputContainer}>
              <Text style={styles.shiftTitle}>Clock Out Note</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter clock-out note..."
                value={clockOutNote}
                onChangeText={setClockOutNote}
                multiline
              />
            </View>
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
          </>
        ) : null}
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("History")}
        >
          <MaterialIcons name="history" size={24} color="#007AFF" />
          <Text style={styles.menuText}>Attendance History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <MaterialIcons name="person" size={24} color="#007AFF" />
          <Text style={styles.menuText}>Profile</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity 
          title="Test Notification" 
          onPress={async () => {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Test",
                body: "Test notification",
              },
              trigger: null, // Immediate
            });
          }}><Text>Test Notification</Text></TouchableOpacity> */}
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
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#007AFF',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
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
    backgroundColor: '#e0e0e0',
  },
  locationInfo: {
    backgroundColor: '#fff',
    padding: 10,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  currentShiftContainer: {
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  textInputContainer: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  shiftTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  shiftInfo: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  buttonContainer: {
    padding: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  clockInButton: {
    backgroundColor: '#4CAF50',
  },
  clockOutButton: {
    backgroundColor: '#FF5722',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  menuContainer: {
    padding: 15,
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  menuText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
});