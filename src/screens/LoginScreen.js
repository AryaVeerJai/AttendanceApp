// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   Image,
//   ScrollView,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { MaterialIcons } from '@expo/vector-icons';
// import { authAPI } from '../services/api';

// export default function LoginScreen({ navigation, onLoginSuccess }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);

//   const handleLogin = async () => {
//     if (!email || !password) {
//       Alert.alert('Error', 'Please enter both email and password');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await authAPI.login({
//         email,
//         password,
//         deviceId: 'unique-device-id', // You can generate this
//         deviceInfo: {
//           deviceId: 'unique-device-id', // Example device ID
//           deviceName: Platform.constants.DeviceName || 'Unknown',
//           deviceType: Platform.constants.InterfaceIdiom || 'Unknown',
//           fcmToken: 'example-fcm-token', // Replace with actual FCM token
//           lastActive: new Date().toISOString(),
//           isActive: true,
//         },
//       });

//       console.log("Login response:", response);

//       if (response?.status == 'success') {
//         console.log('Login successful:', response);
//         // Save user data
//         const userData = {
//           token: response.token,
//           employeeId: response.data.user.employeeId,
//           name: response.data.user.name,
//           email: response.data.user.email,
//           department: response.data.user.department,
//           position: response.data.user.position,
//           profileImage: response.data.user.profileImage,
//         };

//         await AsyncStorage.setItem('userData', JSON.stringify(userData));

//         onLoginSuccess();
        
//         if (rememberMe) {
//           await AsyncStorage.setItem('rememberedEmail', email);
//         }

//         // Navigate to attendance screen
//         // navigation.replace('Attendance');
//       } else {
//         Alert.alert('Login Failed', response.message || 'Invalid credentials');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       Alert.alert(
//         'Network Error',
//         'Cannot connect to server. Please try again later.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleForgotPassword = () => {
//     Alert.alert(
//       'Forgot Password',
//       'Please contact your administrator to reset your password.',
//       [{ text: 'OK' }]
//     );
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <View style={styles.logoContainer}>
//           <View style={styles.logoCircle}>
//             <MaterialIcons name="location-on" size={60} color="#007AFF" />
//           </View>
//           <Text style={styles.appTitle}>Attendance Tracker</Text>
//           <Text style={styles.appSubtitle}>Employee Portal</Text>
//         </View>

//         <View style={styles.formContainer}>
//           <Text style={styles.loginTitle}>Employee Login</Text>
          
//           <View style={styles.inputContainer}>
//             <MaterialIcons name="email" size={24} color="#666" style={styles.inputIcon} />
//             <TextInput
//               style={styles.input}
//               placeholder="Employee Email"
//               value={email}
//               onChangeText={setEmail}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               autoCorrect={false}
//             />
//           </View>

//           <View style={styles.inputContainer}>
//             <MaterialIcons name="lock" size={24} color="#666" style={styles.inputIcon} />
//             <TextInput
//               style={styles.input}
//               placeholder="Password"
//               value={password}
//               onChangeText={setPassword}
//               secureTextEntry={!showPassword}
//             />
//             <TouchableOpacity
//               style={styles.passwordToggle}
//               onPress={() => setShowPassword(!showPassword)}
//             >
//               <MaterialIcons
//                 name={showPassword ? 'visibility-off' : 'visibility'}
//                 size={24}
//                 color="#666"
//               />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.rememberContainer}>
//             <TouchableOpacity
//               style={styles.checkboxContainer}
//               onPress={() => setRememberMe(!rememberMe)}
//             >
//               <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
//                 {rememberMe && <MaterialIcons name="check" size={16} color="#fff" />}
//               </View>
//               <Text style={styles.rememberText}>Remember me</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity onPress={handleForgotPassword}>
//               <Text style={styles.forgotText}>Forgot Password?</Text>
//             </TouchableOpacity>
//           </View>

//           <TouchableOpacity
//             style={[styles.loginButton, loading && styles.loginButtonDisabled]}
//             onPress={handleLogin}
//             disabled={loading}
//           >
//             {loading ? (
//               <Text style={styles.loginButtonText}>Signing In...</Text>
//             ) : (
//               <>
//                 <Text style={styles.loginButtonText}>Sign In</Text>
//                 <MaterialIcons name="arrow-forward" size={24} color="#fff" />
//               </>
//             )}
//           </TouchableOpacity>

//           <View style={styles.infoContainer}>
//             <MaterialIcons name="info" size={18} color="#666" />
//             <Text style={styles.infoText}>
//               Location permission is required for attendance tracking
//             </Text>
//           </View>
//         </View>

//         <View style={styles.footer}>
//           <Text style={styles.footerText}>Need help? Contact your manager</Text>
//           <Text style={styles.versionText}>Version 1.0.0</Text>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'space-between',
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginTop: 60,
//     marginBottom: 40,
//   },
//   logoCircle: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: '#e3f2fd',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//   },
//   appTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginBottom: 5,
//   },
//   appSubtitle: {
//     fontSize: 16,
//     color: '#7f8c8d',
//   },
//   formContainer: {
//     backgroundColor: '#fff',
//     marginHorizontal: 20,
//     padding: 25,
//     borderRadius: 15,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//   },
//   loginTitle: {
//     fontSize: 22,
//     fontWeight: '600',
//     color: '#2c3e50',
//     marginBottom: 25,
//     textAlign: 'center',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//     borderRadius: 10,
//     marginBottom: 15,
//     paddingHorizontal: 15,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   inputIcon: {
//     marginRight: 10,
//   },
//   input: {
//     flex: 1,
//     height: 50,
//     fontSize: 16,
//     color: '#2c3e50',
//   },
//   passwordToggle: {
//     padding: 5,
//   },
//   rememberContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 25,
//   },
//   checkboxContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   checkbox: {
//     width: 22,
//     height: 22,
//     borderRadius: 5,
//     borderWidth: 2,
//     borderColor: '#007AFF',
//     marginRight: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   checkboxChecked: {
//     backgroundColor: '#007AFF',
//   },
//   rememberText: {
//     fontSize: 14,
//     color: '#666',
//   },
//   forgotText: {
//     fontSize: 14,
//     color: '#007AFF',
//     fontWeight: '500',
//   },
//   loginButton: {
//     backgroundColor: '#007AFF',
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     height: 55,
//     borderRadius: 10,
//     marginBottom: 20,
//   },
//   loginButtonDisabled: {
//     backgroundColor: '#ccc',
//   },
//   loginButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//     marginRight: 10,
//   },
//   infoContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#e3f2fd',
//     padding: 12,
//     borderRadius: 8,
//     marginTop: 10,
//   },
//   infoText: {
//     marginLeft: 10,
//     fontSize: 12,
//     color: '#1976d2',
//     flex: 1,
//   },
//   footer: {
//     alignItems: 'center',
//     marginTop: 30,
//     marginBottom: 20,
//   },
//   footerText: {
//     fontSize: 14,
//     color: '#95a5a6',
//     marginBottom: 10,
//   },
//   versionText: {
//     fontSize: 12,
//     color: '#bdc3c7',
//   },
// });


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { authAPI } from '../services/api';

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    loadRememberedEmail();
  }, []);

  const loadRememberedEmail = async () => {
    try {
      const rememberedEmail = await AsyncStorage.getItem('rememberedEmail');
      if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading remembered email:', error);
    }
  };

  // Get or create consistent device ID
  const getDeviceId = async () => {
    try {
      let deviceId = await AsyncStorage.getItem('deviceId');
      
      if (!deviceId) {
        // Generate unique device ID
        const uniqueId = Constants.deviceId || 
                        `${Device.modelName || 'Unknown'}-${Date.now()}`;
        deviceId = uniqueId;
        await AsyncStorage.setItem('deviceId', deviceId);
        console.log('📱 Generated new device ID:', deviceId);
      } else {
        console.log('📱 Using existing device ID:', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return `fallback-${Date.now()}`;
    }
  };

  const getDeviceInfo = () => {
    return {
      deviceName: Device.deviceName || 'Unknown Device',
      deviceType: Device.osName || 'Unknown OS',
      osVersion: Device.osVersion || 'Unknown Version',
      modelName: Device.modelName || 'Unknown Model',
    };
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      // Get consistent device ID
      const deviceId = await getDeviceId();
      const deviceInfo = getDeviceInfo();

      console.log('🔐 Logging in with device:', {
        deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
      });

      const response = await authAPI.login({
        email,
        password,
        deviceId: deviceId,
        deviceInfo: {
          deviceId: deviceId,
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          osVersion: deviceInfo.osVersion,
          fcmToken: 'example-fcm-token', // TODO: Replace with actual FCM token
          lastActive: new Date().toISOString(),
          isActive: true,
        },
      });

      // console.log('✅ Login response:', response);

      if (response?.status === 'success') {
        // Save user data with token
        const userData = {
          token: response.token,
          employeeId: response.data.user.employeeId,
          name: response.data.user.name,
          email: response.data.user.email,
          department: response.data.user.department,
          position: response.data.user.position,
          profileImage: response.data.user.profileImage,
        };

        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        console.log('💾 User data saved successfully');

        // Handle remember me
        if (rememberMe) {
          await AsyncStorage.setItem('rememberedEmail', email);
        } else {
          await AsyncStorage.removeItem('rememberedEmail');
        }

        // Call the onLoginSuccess callback
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Cannot connect to server. Please try again later.';
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Please contact your administrator to reset your password.',
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="location-on" size={60} color="#007AFF" />
          </View>
          <Text style={styles.appTitle}>Attendance Tracker</Text>
          <Text style={styles.appSubtitle}>Employee Portal</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.loginTitle}>Employee Login</Text>
          
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Employee Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <MaterialIcons
                name={showPassword ? 'visibility-off' : 'visibility'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.rememberContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={loading}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <MaterialIcons name="check" size={16} color="#fff" />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.loginButtonText}>Signing In...</Text>
              </>
            ) : (
              <>
                <Text style={styles.loginButtonText}>Sign In</Text>
                <MaterialIcons name="arrow-forward" size={24} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <MaterialIcons name="info" size={18} color="#666" />
            <Text style={styles.infoText}>
              Location permission is required for attendance tracking
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Need help? Contact your manager</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#2c3e50',
  },
  passwordToggle: {
    padding: 5,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  rememberText: {
    fontSize: 14,
    color: '#666',
  },
  forgotText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 55,
    borderRadius: 10,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#a0c4ff',
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 12,
    color: '#1976d2',
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#95a5a6',
    marginBottom: 10,
  },
  versionText: {
    fontSize: 12,
    color: '#bdc3c7',
  },
});