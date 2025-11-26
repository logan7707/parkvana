import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import BookingModal from './BookingModal';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [region, setRegion] = useState({
    latitude: 30.2672,
    longitude: -97.7431,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const filters = ['All', 'Near Me', 'Under $10', 'Available Now'];

  useFocusEffect(
    React.useCallback(() => {
      loadSpots();
    }, [])
  );

  const loadSpots = async () => {
    try {
      setLoading(true);
      const latitude = 30.2672; // Austin, TX
      const longitude = -97.7431;
      const response = await api.searchSpots(latitude, longitude, 10000);
      
      const spotsData = response.spots || response;
      setSpots(Array.isArray(spotsData) ? spotsData : []);
    } catch (error) {
      console.error('Error loading spots:', error);
      Alert.alert('Error', 'Could not load parking spots');
    } finally {
      setLoading(false);
    }
  };

  const handleSpotPress = (spot) => {
    setSelectedSpot(spot);
    setBookingModalVisible(true);
  };

  const handleMarkerPress = (spot) => {
    // Center map on selected spot
    if (spot.latitude && spot.longitude) {
      setRegion({
        latitude: spot.latitude,
        longitude: spot.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
    setSelectedSpot(spot);
    setBookingModalVisible(true);
  };

  const renderSpot = ({ item }) => (
    <TouchableOpacity
      style={styles.spotCard}
      onPress={() => handleSpotPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.spotImage}>
        <Text style={styles.spotImageEmoji}>🅿️</Text>
      </View>
      <View style={styles.spotInfo}>
        <Text style={styles.spotTitle}>{item.title}</Text>
        <Text style={styles.spotAddress} numberOfLines={1}>
          {item.address}
        </Text>
        <View style={styles.spotMeta}>
          <Text style={styles.spotDistance}>0.5mi away</Text>
          <Text style={styles.spotDot}>•</Text>
          <Text style={styles.spotAvailability}>Available now</Text>
        </View>
        <Text style={styles.spotPrice}>${item.hourly_rate}/hr</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ba360" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Area */}
      <View style={styles.mapArea}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          provider={PROVIDER_GOOGLE}
        >
          {spots.map((spot) => {
            if (spot.latitude && spot.longitude) {
              return (
                <Marker
                  key={spot.id}
                  coordinate={{
                    latitude: parseFloat(spot.latitude),
                    longitude: parseFloat(spot.longitude),
                  }}
                  onPress={() => handleMarkerPress(spot)}
                >
                  <View style={styles.customMarker}>
                    <Text style={styles.markerText}>🅿️</Text>
                    <Text style={styles.markerPrice}>${spot.hourly_rate}/hr</Text>
                  </View>
                </Marker>
              );
            }
            return null;
          })}
        </MapView>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search location..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results List */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Nearby Parking ({spots.length})</Text>
        <FlatList
          data={spots}
          renderItem={renderSpot}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Booking Modal */}
      <BookingModal
        visible={bookingModalVisible}
        spot={selectedSpot}
        onClose={() => setBookingModalVisible(false)}
        onSuccess={() => {
          setBookingModalVisible(false);
          loadSpots();
        }}
      />
    </View>
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
    backgroundColor: '#f5f5f5',
  },
  mapArea: {
    height: '45%',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  customMarker: {
    backgroundColor: '#0ba360',
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontSize: 20,
  },
  markerPrice: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  searchBar: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  filtersContent: {
    gap: 10,
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipActive: {
    backgroundColor: '#0ba360',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  spotCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  spotImage: {
    width: 80,
    height: 80,
    backgroundColor: '#0ba360',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  spotImageEmoji: {
    fontSize: 32,
  },
  spotInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  spotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  spotAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  spotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  spotDistance: {
    fontSize: 13,
    color: '#666',
  },
  spotDot: {
    fontSize: 13,
    color: '#666',
    marginHorizontal: 6,
  },
  spotAvailability: {
    fontSize: 13,
    color: '#0ba360',
    fontWeight: '600',
  },
  spotPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ba360',
  },
});