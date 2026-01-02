import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { authAPI } from '../services/api';

export default function ProfileScreen({ navigation, onLogoutSuccess }) {
  const [userData, setUserData] = useState(null);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoClockOut, setAutoClockOut] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    checkLocationPermission();
    checkNotificationPermission();
  }, []);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem('userData');
    if (data) {
      setUserData(JSON.parse(data));
    }
  };

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationEnabled(status === 'granted');
  };

  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    setLoading(true);
    try {
      await authAPI.logout();
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('offlineLocations');
      await AsyncStorage.removeItem('offlineAttendance');
      onLogoutSuccess();
      // navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout locally anyway
      await AsyncStorage.removeItem('userData');
      navigation.replace('Login');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationToggle = async (value) => {
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationEnabled(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to track attendance. Please enable it in settings.',
          [
            { text: 'Cancel' },
            { text: 'Open Settings', onPress: () => Location.getForegroundPermissionsAsync() },
          ]
        );
      }
    } else {
      setLocationEnabled(false);
      Alert.alert(
        'Location Disabled',
        'Attendance tracking will not work without location permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleNotificationToggle = async (value) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all locally stored data except your login information. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('offlineLocations');
              await AsyncStorage.removeItem('offlineAttendance');
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleViewHelp = () => {
    Alert.alert(
      'Help & Support',
      'For assistance:\n\n1. Contact your manager\n2. Email: support@company.com\n3. Phone: +1 (555) 123-4567',
      [{ text: 'OK' }]
    );
  };

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {userData.profileImage ? (
            <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileInitials}>
                {userData.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.profileName}>{userData.name}</Text>
        <Text style={styles.profileRole}>{userData.position}</Text>
        <Text style={styles.profileDepartment}>{userData.department} Department</Text>
      </View>

      {/* Employee Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Employee Information</Text>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="badge" size={22} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Employee ID</Text>
            <Text style={styles.infoValue}>{userData.employeeId}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="email" size={22} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userData.email}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="business" size={22} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Position</Text>
            <Text style={styles.infoValue}>{userData.position}</Text>
          </View>
        </View>
      </View>

      {/* App Settings */}
      {/* <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>App Settings</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="location" size={24} color="#4CAF50" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Location Tracking</Text>
              <Text style={styles.settingDescription}>
                Required for attendance marking
              </Text>
            </View>
          </View>
          <Switch
            value={locationEnabled}
            onValueChange={handleLocationToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={locationEnabled ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications" size={24} color="#FF9800" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Shift reminders and updates
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: '#767577', true: '#ffb74d' }}
            thumbColor={notificationsEnabled ? '#FF9800' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <MaterialIcons name="timer" size={24} color="#9C27B0" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Auto Clock-Out</Text>
              <Text style={styles.settingDescription}>
                Automatically clock out after 8 hours
              </Text>
            </View>
          </View>
          <Switch
            value={autoClockOut}
            onValueChange={setAutoClockOut}
            trackColor={{ false: '#767577', true: '#ce93d8' }}
            thumbColor={autoClockOut ? '#9C27B0' : '#f4f3f4'}
          />
        </View>
      </View> */}

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
          <MaterialIcons name="delete-sweep" size={24} color="#666" />
          <Text style={styles.actionButtonText}>Clear Cache</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleViewHelp}>
          <MaterialIcons name="help-outline" size={24} color="#666" />
          <Text style={styles.actionButtonText}>Help & Support</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('History')}>
          <MaterialIcons name="history" size={24} color="#666" />
          <Text style={styles.actionButtonText}>Attendance History</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, loading && styles.logoutButtonDisabled]}
        onPress={handleLogout}
        disabled={loading}
      >
        <MaterialIcons name="logout" size={24} color="#fff" />
        <Text style={styles.logoutButtonText}>
          {loading ? 'Logging out...' : 'Logout'}
        </Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Attendance Tracker v1.0.0</Text>
        <Text style={styles.appInfoSubtext}>© 2025 Wattn Engineering</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    backgroundColor: '#007AFF',
    padding: 25,
    paddingTop: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  profileRole: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 3,
  },
  profileDepartment: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  settingsSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  actionsSection: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  actionButtonText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#2c3e50',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    margin: 15,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  logoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: '#95a5a6',
    marginBottom: 5,
  },
  appInfoSubtext: {
    fontSize: 12,
    color: '#bdc3c7',
  },
});