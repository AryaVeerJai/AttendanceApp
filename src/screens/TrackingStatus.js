import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

const TrackingStatus = () => {
  const [status, setStatus] = useState({
    isRegistered: false,
    isRunning: false,
    foregroundPermission: 'unknown',
    backgroundPermission: 'unknown',
    lastCheck: new Date().toLocaleTimeString(),
  });

  const checkStatus = async () => {
    try {
      // Check if task is registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      
      // Check if task is running
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      
      // Check permissions
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
      
      setStatus({
        isRegistered,
        isRunning,
        foregroundPermission: foregroundStatus,
        backgroundPermission: backgroundStatus,
        lastCheck: new Date().toLocaleTimeString(),
      });
      
      console.log('📊 Tracking Status:', {
        isRegistered,
        isRunning,
        foregroundStatus,
        backgroundStatus,
      });
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Check every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (running) => running ? '#4CAF50' : '#F44336';
  const getStatusText = (running) => running ? 'RUNNING' : 'NOT RUNNING';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Tracking Status</Text>
      
      <View style={styles.statusRow}>
        <Text style={styles.label}>Task Registered:</Text>
        <Text style={[styles.value, { color: getStatusColor(status.isRegistered) }]}>
          {status.isRegistered ? 'YES' : 'NO'}
        </Text>
      </View>
      
      <View style={styles.statusRow}>
        <Text style={styles.label}>Background Tracking:</Text>
        <Text style={[styles.value, { color: getStatusColor(status.isRunning) }]}>
          {getStatusText(status.isRunning)}
        </Text>
      </View>
      
      <View style={styles.statusRow}>
        <Text style={styles.label}>Foreground Permission:</Text>
        <Text style={[styles.value, { color: getStatusColor(status.foregroundPermission === 'granted') }]}>
          {status.foregroundPermission.toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.statusRow}>
        <Text style={styles.label}>Background Permission:</Text>
        <Text style={[styles.value, { color: getStatusColor(status.backgroundPermission === 'granted') }]}>
          {status.backgroundPermission.toUpperCase()}
        </Text>
      </View>
      
      <Text style={styles.lastCheck}>Last checked: {status.lastCheck}</Text>
      
      <TouchableOpacity style={styles.button} onPress={checkStatus}>
        <Text style={styles.buttonText}>🔄 Refresh Status</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  lastCheck: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default TrackingStatus;