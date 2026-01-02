// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   RefreshControl,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import { MaterialIcons } from '@expo/vector-icons';
// import moment from 'moment';
// import { attendanceAPI } from '../services/api';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export default function HistoryScreen() {
//   const [attendanceHistory, setAttendanceHistory] = useState([]);
//   const [filteredHistory, setFilteredHistory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState('all'); // all, today, week, month
//   const [userData, setUserData] = useState(null);
//   const [stats, setStats] = useState({
//     totalHours: 0,
//     totalDays: 0,
//     averageHours: 0,
//   });

//   useEffect(() => {
//     loadUserData();
//     fetchAttendanceHistory();
//   }, []);

//   useEffect(() => {
//     applyFilter();
//   }, [selectedFilter, attendanceHistory]);

//   const loadUserData = async () => {
//     const data = await AsyncStorage.getItem('userData');
//     if (data) {
//       setUserData(JSON.parse(data));
//     }
//   };

//   const fetchAttendanceHistory = async (showRefresh = false) => {
//     if (showRefresh) {
//       setRefreshing(true);
//     } else {
//       setLoading(true);
//     }

//     try {
//       const response = await attendanceAPI.getHistory({
//         employeeId: userData?.employeeId,
//         limit: 50,
//       });
//       // console.log('Attendance history response:', response);

//       if (response.status === 'success') {
//         setAttendanceHistory(response.data.attendance);
//         calculateStats(response.data.attendance);
//       } else {
//         Alert.alert('Error', response.message || 'Failed to fetch history');
//       }
//     } catch (error) {
//       console.error('Error fetching history:', error);
//       Alert.alert('Error', 'Failed to load attendance history');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const calculateStats = (data) => {
//     // console.log('Calculating stats for data:', data);
//     if (!data || data.length === 0) {
//       setStats({ totalHours: 0, totalDays: 0, averageHours: 0 });
//       return;
//     }

//     // console.log('Calculating stats for', data.length, 'records');

//     const completedShifts = data.filter(
//       (record) => record.clockIn && record.clockOut
//     );

//     let totalMinutes = 0;
//     completedShifts.forEach((record) => {
//       const start = moment(record.clockIn?.time);
//       const end = moment(record.clockOut?.time);
//       const duration = moment.duration(end.diff(start));
//       totalMinutes += duration.asMinutes();
//     });

//     const totalHours = totalMinutes / 60;
//     const totalDays = completedShifts.length;
//     const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

//     setStats({
//       totalHours: parseFloat(totalHours.toFixed(1)),
//       totalDays,
//       averageHours: parseFloat(averageHours.toFixed(1)),
//     });
//   };

//   const applyFilter = () => {
//     // console.log('Applying filter:', selectedFilter);
//     if (!attendanceHistory.length) {

//       setFilteredHistory([]);
//       return;
//     }

//     let filtered = [...attendanceHistory];

//     switch (selectedFilter) {
//       case 'today':
//         filtered = filtered.filter((record) =>
//           moment(record.clockIn.time).isSame(moment(), 'day')
//         );
//         break;
//       case 'week':
//         filtered = filtered.filter((record) =>
//           moment(record.clockIn.time).isSame(moment(), 'week')
//         );
//         break;
//       case 'month':
//         filtered = filtered.filter((record) =>
//           moment(record.clockIn.time).isSame(moment(), 'month')
//         );
//         break;
//       case 'all':
//       default:
//         break;
//     }
//     // console.log('Filtered records count:', filtered.length);

//     setFilteredHistory(filtered);
//   };

//   const handleFilterPress = (filter) => {
//     setSelectedFilter(filter);
//   };

//   const formatDuration = (startTime, endTime) => {
//     if (!startTime || !endTime) return 'N/A';
    
//     const start = moment(startTime);
//     const end = moment(endTime);
//     const duration = moment.duration(end.diff(start));
    
//     const hours = Math.floor(duration.asHours());
//     const minutes = Math.floor(duration.asMinutes()) % 60;
    
//     return `${hours}h ${minutes}m`;
//   };

//   const formatLocation = (lat, lon) => {
//     if (!lat || !lon) return 'Location not available';
//   }

//   const getStatusColor = (record) => {
//     if (!record.clockOut?.time) return '#FF9800'; // Orange for active shift
//     const duration = moment.duration(moment(record.clockOut?.time).diff(moment(record.clockIn?.time)));
//     const hours = duration.asHours();
    
//     if (hours >= 8) return '#4CAF50'; // Green for full shift
//     if (hours >= 4) return '#FFC107'; // Yellow for partial shift
//     return '#FF5722'; // Red for short shift
//   };

//   const renderFilterButtons = () => (
//     <ScrollView
//       horizontal
//       showsHorizontalScrollIndicator={false}
//       style={styles.filterContainer}
//       contentContainerStyle={styles.filterContent}
//     >
//       {[
//         { key: 'today', label: 'Today' },
//         { key: 'week', label: 'This Week' },
//         { key: 'month', label: 'This Month' },
//         { key: 'all', label: 'All Time' },
//       ].map((filter) => (
//         <TouchableOpacity
//           key={filter.key}
//           style={[
//             styles.filterButton,
//             selectedFilter === filter.key && styles.filterButtonActive,
//           ]}
//           onPress={() => handleFilterPress(filter.key)}
//         >
//           <Text
//             style={[
//               styles.filterButtonText,
//               selectedFilter === filter.key && styles.filterButtonTextActive,
//             ]}
//           >
//             {filter.label}
//           </Text>
//         </TouchableOpacity>
//       ))}
//     </ScrollView>
//   );

//   const renderStats = () => (
//     <View style={styles.statsContainer}>
//       <View style={styles.statCard}>
//         <MaterialIcons name="timer" size={24} color="#007AFF" />
//         <Text style={styles.statValue}>{stats.totalHours}</Text>
//         <Text style={styles.statLabel}>Total Hours</Text>
//       </View>
      
//       <View style={styles.statCard}>
//         <MaterialIcons name="calendar-today" size={24} color="#4CAF50" />
//         <Text style={styles.statValue}>{stats.totalDays}</Text>
//         <Text style={styles.statLabel}>Total Days</Text>
//       </View>
      
//       <View style={styles.statCard}>
//         <MaterialIcons name="trending-up" size={24} color="#FF9800" />
//         <Text style={styles.statValue}>{stats.averageHours}</Text>
//         <Text style={styles.statLabel}>Avg Hours/Day</Text>
//       </View>
//     </View>
//   );

//   const renderHistoryItem = (item, index) => (
//     <View key={index} style={styles.historyCard}>
//       <View style={styles.historyHeader}>
//         <View style={styles.dateContainer}>
//           <Text style={styles.dateText}>
//             {moment(item.clockIn.time).format('MMM DD, YYYY')}
//           </Text>
//           <Text style={styles.dayText}>
//             {moment(item.clockIn.time).format('dddd')}
//           </Text>
//         </View>
        
//         <View style={styles.statusIndicator}>
//           <View
//             style={[
//               styles.statusDot,
//               { backgroundColor: getStatusColor(item) },
//             ]}
//           />
//           <Text style={styles.statusText}>
//             {item.clockOut.time ? 'Completed' : 'In Progress'}
//           </Text>
//         </View>
//       </View>

//       <View style={styles.timesContainer}>
//         <View style={styles.timeBlock}>
//           <MaterialIcons name="login" size={18} color="#666" />
//           <View style={styles.timeDetails}>
//             <Text style={styles.timeLabel}>Clock In</Text>
//             <Text style={styles.timeValue}>
//               {moment(item.clockIn.time).format('hh:mm A')}
//             </Text>
//           </View>
//         </View>

//         {item.clockOut.time && (
//           <>
//             <View style={styles.timeBlock}>
//               <MaterialIcons name="logout" size={18} color="#666" />
//               <View style={styles.timeDetails}>
//                 <Text style={styles.timeLabel}>Clock Out</Text>
//                 <Text style={styles.timeValue}>
//                   {moment(item.clockOut.time).format('hh:mm A')}
//                 </Text>
//               </View>
//             </View>

//             <View style={styles.durationBlock}>
//               <MaterialIcons name="access-time" size={18} color="#666" />
//               <View style={styles.timeDetails}>
//                 <Text style={styles.timeLabel}>Duration</Text>
//                 <Text style={styles.durationValue}>
//                   {formatDuration(item.clockIn.time, item.clockOut.time)}
//                 </Text>
//               </View>
//             </View>
//           </>
//         )}
//       </View>

//       {item.notes && (
//         <View style={styles.notesContainer}>
//           <MaterialIcons name="notes" size={16} color="#666" />
//           <Text style={styles.notesText} numberOfLines={2}>
//             {item.notes}
//           </Text>
//         </View>
//       )}

//       <View style={styles.locationContainer}>
//         <MaterialIcons name="location-on" size={16} color="#666" />
//         <Text style={styles.locationText} numberOfLines={1}>
//           {item.clock_in_location || 'Location not available'}
//         </Text>
//       </View>
//     </View>
//   );

//   if (loading) {
//     return (
//       <View style={styles.centerContainer}>
//         <ActivityIndicator size="large" color="#007AFF" />
//         <Text style={styles.loadingText}>Loading history...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Attendance History</Text>
//         <TouchableOpacity
//           style={styles.refreshButton}
//           onPress={() => fetchAttendanceHistory()}
//           disabled={refreshing}
//         >
//           <MaterialIcons
//             name="refresh"
//             size={24}
//             color="#007AFF"
//             style={refreshing && styles.refreshingIcon}
//           />
//         </TouchableOpacity>
//       </View>

//       {renderStats()}
//       {renderFilterButtons()}

//       <ScrollView
//         style={styles.historyList}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={() => fetchAttendanceHistory(true)}
//             colors={['#007AFF']}
//           />
//         }
//         contentContainerStyle={styles.historyListContent}
//       >
//         {filteredHistory.length > 0 ? (
//           filteredHistory.map((item, index) => renderHistoryItem(item, index))
//         ) : (
//           <View style={styles.emptyContainer}>
//             <MaterialIcons name="history" size={60} color="#ccc" />
//             <Text style={styles.emptyText}>No attendance records found</Text>
//             <Text style={styles.emptySubtext}>
//               {selectedFilter === 'today'
//                 ? 'No attendance marked today'
//                 : 'No records for this period'}
//             </Text>
//           </View>
//         )}
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 10,
//     color: '#666',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     paddingTop: 40,
//     backgroundColor: '#007AFF',
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   refreshButton: {
//     padding: 5,
//   },
//   refreshingIcon: {
//     transform: [{ rotate: '360deg' }],
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     padding: 15,
//     backgroundColor: '#fff',
//   },
//   statCard: {
//     flex: 1,
//     alignItems: 'center',
//     padding: 15,
//     borderRadius: 10,
//     backgroundColor: '#f8f9fa',
//     marginHorizontal: 5,
//   },
//   statValue: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     marginVertical: 5,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#95a5a6',
//     textAlign: 'center',
//   },
//   filterContainer: {
//     backgroundColor: '#fff',
//     paddingVertical: 10,
//   },
//   filterContent: {
//     paddingHorizontal: 15,
//   },
//   filterButton: {
//     paddingHorizontal: 20,
//     paddingVertical: 8,
//     borderRadius: 20,
//     backgroundColor: '#f5f5f5',
//     marginRight: 10,
//   },
//   filterButtonActive: {
//     backgroundColor: '#007AFF',
//   },
//   filterButtonText: {
//     color: '#666',
//     fontWeight: '500',
//   },
//   filterButtonTextActive: {
//     color: '#fff',
//   },
//   historyList: {
//     flex: 1,
//   },
//   historyListContent: {
//     padding: 15,
//   },
//   historyCard: {
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 10,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   historyHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   dateContainer: {
//     flex: 1,
//   },
//   dateText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2c3e50',
//   },
//   dayText: {
//     fontSize: 14,
//     color: '#95a5a6',
//     marginTop: 2,
//   },
//   statusIndicator: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     marginRight: 6,
//   },
//   statusText: {
//     fontSize: 12,
//     color: '#666',
//   },
//   timesContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 15,
//   },
//   timeBlock: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   durationBlock: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   timeDetails: {
//     alignItems: 'center',
//     marginTop: 5,
//   },
//   timeLabel: {
//     fontSize: 12,
//     color: '#95a5a6',
//     marginBottom: 2,
//   },
//   timeValue: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#2c3e50',
//   },
//   durationValue: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#007AFF',
//   },
//   notesContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//     padding: 10,
//     borderRadius: 5,
//     marginBottom: 10,
//   },
//   notesText: {
//     flex: 1,
//     marginLeft: 8,
//     fontSize: 12,
//     color: '#666',
//     fontStyle: 'italic',
//   },
//   locationContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   locationText: {
//     flex: 1,
//     marginLeft: 8,
//     fontSize: 12,
//     color: '#666',
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     padding: 40,
//   },
//   emptyText: {
//     fontSize: 18,
//     color: '#95a5a6',
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#bdc3c7',
//     textAlign: 'center',
//   },
// });



import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { attendanceAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen() {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [userData, setUserData] = useState(null);
  const [locationCache, setLocationCache] = useState({});
  const [stats, setStats] = useState({
    totalHours: 0,
    totalDays: 0,
    averageHours: 0,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchAttendanceHistory();
    }
  }, [userData]);

  useEffect(() => {
    applyFilter();
  }, [selectedFilter, attendanceHistory]);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem('userData');
    if (data) {
      setUserData(JSON.parse(data));
    }
  };

  // Utility function to fetch address from coordinates
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
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      return data.display_name || 'Location not available';
    } catch (error) {
      console.error('Error fetching address:', error);
      return 'Location not available';
    }
  };

  // Fetch location for a specific item
  const fetchLocationForItem = async (item) => {
    const itemId = item._id;
    
    // Skip if already cached
    if (locationCache[itemId]) return;

    // Set loading state
    setLocationCache(prev => ({
      ...prev,
      [itemId]: 'Loading...'
    }));

    const coordinates = item.clockIn?.location?.coordinates;
    
    if (coordinates && coordinates.length === 2) {
      const [lon, lat] = coordinates; // GeoJSON format: [longitude, latitude]
      const address = await getAddressFromCoordinates(lat, lon);
      
      setLocationCache(prev => ({
        ...prev,
        [itemId]: address
      }));
    } else {
      setLocationCache(prev => ({
        ...prev,
        [itemId]: 'Location not available'
      }));
    }
  };

  const fetchAttendanceHistory = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await attendanceAPI.getHistory({
        employeeId: userData?.employeeId,
        limit: 50,
      });

      if (response.status === 'success') {
        setAttendanceHistory(response.data.attendance);
        calculateStats(response.data.attendance);
        
        // Clear location cache on refresh to get fresh data
        if (showRefresh) {
          setLocationCache({});
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      Alert.alert('Error', 'Failed to load attendance history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      setStats({ totalHours: 0, totalDays: 0, averageHours: 0 });
      return;
    }

    const completedShifts = data.filter(
      (record) => record.clockIn && record.clockOut
    );

    let totalMinutes = 0;
    completedShifts.forEach((record) => {
      const start = moment(record.clockIn?.time);
      const end = moment(record.clockOut?.time);
      const duration = moment.duration(end.diff(start));
      totalMinutes += duration.asMinutes();
    });

    const totalHours = totalMinutes / 60;
    const totalDays = completedShifts.length;
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

    setStats({
      totalHours: parseFloat(totalHours.toFixed(1)),
      totalDays,
      averageHours: parseFloat(averageHours.toFixed(1)),
    });
  };

  const applyFilter = () => {
    if (!attendanceHistory.length) {
      setFilteredHistory([]);
      return;
    }

    let filtered = [...attendanceHistory];

    switch (selectedFilter) {
      case 'today':
        filtered = filtered.filter((record) =>
          moment(record.clockIn.time).isSame(moment(), 'day')
        );
        break;
      case 'week':
        filtered = filtered.filter((record) =>
          moment(record.clockIn.time).isSame(moment(), 'week')
        );
        break;
      case 'month':
        filtered = filtered.filter((record) =>
          moment(record.clockIn.time).isSame(moment(), 'month')
        );
        break;
      case 'all':
      default:
        break;
    }

    setFilteredHistory(filtered);
  };

  const handleFilterPress = (filter) => {
    setSelectedFilter(filter);
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = moment(startTime);
    const end = moment(endTime);
    const duration = moment.duration(end.diff(start));
    
    const hours = Math.floor(duration.asHours());
    const minutes = Math.floor(duration.asMinutes()) % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (record) => {
    if (!record.clockOut?.time) return '#FF9800';
    const duration = moment.duration(moment(record.clockOut?.time).diff(moment(record.clockIn?.time)));
    const hours = duration.asHours();
    
    if (hours >= 8) return '#4CAF50';
    if (hours >= 4) return '#FFC107';
    return '#FF5722';
  };

  const renderFilterButtons = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {[
        { key: 'today', label: 'Today' },
        { key: 'week', label: 'This Week' },
        { key: 'month', label: 'This Month' },
        { key: 'all', label: 'All Time' },
      ].map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            selectedFilter === filter.key && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterPress(filter.key)}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedFilter === filter.key && styles.filterButtonTextActive,
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <MaterialIcons name="timer" size={24} color="#007AFF" />
        <Text style={styles.statValue}>{stats.totalHours}</Text>
        <Text style={styles.statLabel}>Total Hours</Text>
      </View>
      
      <View style={styles.statCard}>
        <MaterialIcons name="calendar-today" size={24} color="#4CAF50" />
        <Text style={styles.statValue}>{stats.totalDays}</Text>
        <Text style={styles.statLabel}>Total Days</Text>
      </View>
      
      <View style={styles.statCard}>
        <MaterialIcons name="trending-up" size={24} color="#FF9800" />
        <Text style={styles.statValue}>{stats.averageHours}</Text>
        <Text style={styles.statLabel}>Avg Hours/Day</Text>
      </View>
    </View>
  );

  const HistoryItem = ({ item, index }) => {
    // Fetch location when component mounts
    useEffect(() => {
      if (!locationCache[item._id]) {
        fetchLocationForItem(item);
      }
    }, [item._id]);

    return (
      <View key={index} style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {moment(item.clockIn.time).format('MMM DD, YYYY')}
            </Text>
            <Text style={styles.dayText}>
              {moment(item.clockIn.time).format('dddd')}
            </Text>
          </View>
          
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item) },
              ]}
            />
            <Text style={styles.statusText}>
              {item.clockOut?.time ? 'Completed' : 'In Progress'}
            </Text>
          </View>
        </View>

        <View style={styles.timesContainer}>
          <View style={styles.timeBlock}>
            <MaterialIcons name="login" size={18} color="#666" />
            <View style={styles.timeDetails}>
              <Text style={styles.timeLabel}>Clock In</Text>
              <Text style={styles.timeValue}>
                {moment(item.clockIn.time).format('hh:mm A')}
              </Text>
            </View>
          </View>

          {item.clockOut?.time && (
            <>
              <View style={styles.timeBlock}>
                <MaterialIcons name="logout" size={18} color="#666" />
                <View style={styles.timeDetails}>
                  <Text style={styles.timeLabel}>Clock Out</Text>
                  <Text style={styles.timeValue}>
                    {moment(item.clockOut.time).format('hh:mm A')}
                  </Text>
                </View>
              </View>

              <View style={styles.durationBlock}>
                <MaterialIcons name="access-time" size={18} color="#666" />
                <View style={styles.timeDetails}>
                  <Text style={styles.timeLabel}>Duration</Text>
                  <Text style={styles.durationValue}>
                    {formatDuration(item.clockIn.time, item.clockOut.time)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <MaterialIcons name="notes" size={16} color="#666" />
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}

        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={16} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationCache[item._id] || 'Loading location...'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchAttendanceHistory()}
          disabled={refreshing}
        >
          <MaterialIcons
            name="refresh"
            size={24}
            color="#007AFF"
            style={refreshing && styles.refreshingIcon}
          />
        </TouchableOpacity>
      </View>

      {renderStats()}
      {renderFilterButtons()}

      <ScrollView
        style={styles.historyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAttendanceHistory(true)}
            colors={['#007AFF']}
          />
        }
        contentContainerStyle={styles.historyListContent}
      >
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item, index) => (
            <HistoryItem key={item._id || index} item={item} index={index} />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No attendance records found</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter === 'today'
                ? 'No attendance marked today'
                : 'No records for this period'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 5,
  },
  refreshingIcon: {
    transform: [{ rotate: '360deg' }],
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  filterContent: {
    paddingHorizontal: 15,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    padding: 15,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  dayText: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  timesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
  },
  durationBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timeDetails: {
    alignItems: 'center',
    marginTop: 5,
  },
  timeLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  durationValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  notesText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#95a5a6',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
});