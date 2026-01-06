import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OwnerDashboard = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchOwnerBookings();
  }, []);

  const fetchOwnerBookings = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        console.error('No user ID found in AsyncStorage');
        setBookings([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('Fetching bookings for user ID:', userId);
      
      const response = await fetch(
        `https://parkvana-production.up.railway.app/api/bookings/owner/${userId}`
      );
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('Response not OK:', response.status);
        setBookings([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const data = await response.json();
      console.log('Bookings data received:', data);
      console.log('Is data an array?', Array.isArray(data));
      console.log('Number of bookings:', Array.isArray(data) ? data.length : 'N/A');
      
      // Make sure data is an array
      if (Array.isArray(data)) {
        setBookings(data);
      } else {
        console.error('API did not return an array. Received:', typeof data, data);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching owner bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOwnerBookings();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'completed':
        return '#6B7280';
      default:
        return '#3B82F6';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateEarnings = (filter) => {
    // Safety check - make sure bookings is an array
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return 0;
    }

    let filteredBookings = bookings;
    
    if (filter === 'completed') {
      filteredBookings = bookings.filter(b => b.status === 'completed');
    } else if (filter === 'upcoming') {
      filteredBookings = bookings.filter(b => b.status === 'confirmed' && new Date(b.start_date) > new Date());
    }
    
    return filteredBookings.reduce((sum, booking) => {
      const price = parseFloat(booking.total_price) || 0;
      return sum + price;
    }, 0);
  };

  const getFilteredBookings = () => {
    // Safety check - make sure bookings is an array
    if (!Array.isArray(bookings)) {
      return [];
    }

    if (selectedFilter === 'all') return bookings;
    
    if (selectedFilter === 'upcoming') {
      return bookings.filter(b => b.status === 'confirmed' && new Date(b.start_date) > new Date());
    }
    
    if (selectedFilter === 'active') {
      const now = new Date();
      return bookings.filter(b => 
        b.status === 'confirmed' && 
        new Date(b.start_date) <= now && 
        new Date(b.end_date) >= now
      );
    }
    
    return bookings.filter(b => b.status === selectedFilter);
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Owner Dashboard</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Earnings Overview */}
        <View style={styles.earningsSection}>
          <Text style={styles.sectionTitle}>Earnings Overview</Text>
          <View style={styles.earningsCards}>
            <View style={[styles.earningsCard, styles.totalCard]}>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <Text style={styles.earningsAmount}>${calculateEarnings('all').toFixed(2)}</Text>
            </View>
            <View style={styles.earningsCard}>
              <Text style={styles.earningsLabel}>Completed</Text>
              <Text style={styles.earningsAmount}>${calculateEarnings('completed').toFixed(2)}</Text>
            </View>
            <View style={styles.earningsCard}>
              <Text style={styles.earningsLabel}>Upcoming</Text>
              <Text style={styles.earningsAmount}>${calculateEarnings('upcoming').toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'upcoming', 'active', 'completed', 'cancelled'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  selectedFilter === filter && styles.filterTabActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === filter && styles.filterTabTextActive,
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bookings List */}
        <View style={styles.bookingsSection}>
          <Text style={styles.sectionTitle}>
            Bookings ({filteredBookings.length})
          </Text>
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No bookings found</Text>
              <Text style={styles.emptyStateSubtext}>
                When someone books your parking space, it will appear here
              </Text>
            </View>
          ) : (
            filteredBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.spaceTitle}>{booking.space_title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(booking.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
                  </View>
                </View>
                
                <Text style={styles.spaceAddress}>{booking.space_address}</Text>
                
                <View style={styles.bookingInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{booking.renter_name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>
                      {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>
                      {booking.rate_type ? booking.rate_type.charAt(0).toUpperCase() + booking.rate_type.slice(1) : 'Hourly'} Rate
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingFooter}>
                  <Text style={styles.priceText}>${booking.total_price}</Text>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => {
                      // Navigate to booking details or contact renter
                      console.log('View booking:', booking.id);
                    }}
                  >
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  earningsSection: {
    padding: 20,
    backgroundColor: '#FFF',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 15,
  },
  earningsCards: {
    flexDirection: 'row',
    gap: 10,
  },
  earningsCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 12,
  },
  totalCard: {
    backgroundColor: '#DBEAFE',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  earningsAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  filterSection: {
    backgroundColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  bookingsSection: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  spaceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  spaceAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  bookingInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  viewButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default OwnerDashboard;