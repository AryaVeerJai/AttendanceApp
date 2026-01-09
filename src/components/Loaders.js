import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';

// Option 1: Simple Spinner (Most Common)
export const SpinnerLoader = ({ text = 'Loading...', color = '#007AFF' }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={color} />
    <Text style={styles.text}>{text}</Text>
  </View>
);

// Option 2: Animated Dots
export const DotsLoader = ({ color = '#4CAF50' }) => {
  const [dots, setDots] = React.useState('');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={[styles.dotsText, { color }]}>
        Loading{dots}
      </Text>
    </View>
  );
};

// Option 3: Pulse Animation
export const PulseLoader = ({ color = '#4CAF50' }) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulse,
          { 
            backgroundColor: color,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
    </View>
  );
};

// Option 4: Skeleton Loader (for lists)
export const SkeletonLoader = () => {
  const fadeAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((item) => (
        <Animated.View
          key={item}
          style={[styles.skeletonItem, { opacity: fadeAnim }]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  dotsText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  skeletonContainer: {
    flex: 1,
    padding: 20,
  },
  skeletonItem: {
    height: 80,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
  },
});