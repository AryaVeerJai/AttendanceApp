// src/components/FullScreenLoader.js
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';

export const FullScreenLoader = ({ visible, text = 'Please wait...' }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});