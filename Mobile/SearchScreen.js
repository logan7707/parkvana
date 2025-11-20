import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { api } from './api';
import BookingModal from './BookingModal';

export default function SearchScreen() {
  const [location, setLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [parkingSpots, setParkingSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchParkingSpots();
    }
  }, [location]);

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need location permission to show nearby parking');
        setLocation({
          latitude: 30.2672,
          longitude: -97.7431,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setLocation({
        latitude: 30.2672,
        longitude: -97.7431,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  const fetchParkingSpots = async () => {
    if (!location) return;

    setLoading(true);
    try {
      const response = await api.searchSpots(location.latitude, location.longitude, 50000);
      console.log('Fetched spots:', response);
      
      if (response.spots && response.spots.length > 0) {
        setParkingSpots(response.spots);
      } else {
        Alert.alert('No Parking Found', 'No parking spots found in your area.');
      }
    } catch (error) {
      console.error('Error fetching parking spots:', error);
      Alert.alert('Error', 'Could not load parking spots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    Alert.alert('Search', `Searching for parking near: ${searchQuery}`);
  };

  const handleBookSpot = (spot) => {
    setSelectedSpot(spot);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    Alert.alert('Success', 'Check "My Bookings" to see your reservation!');
    fetchParkingSpots(); // Refresh the list
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {location && (
        <MapView
          style={styles.map}
          initialRegion={location}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {parkingSpots.map((spot) => (
            <Marker
              key={spot.id}
              coordinate={{
                latitude: parseFloat(spot.latitude),
                longitude: parseFloat(spot.longitude),
              }}
              title={spot.title}
              description={`$${spot.hourly_rate}/hr`}
              onPress={() => setSelectedSpot(spot)}
            />
          ))}
        </MapView>
      )}

      {selectedSpot && (
        <View style={styles.spotInfo}>
          <View style={styles.spotDetails}>
            <Text style={styles.spotTitle}>{selectedSpot.title}</Text>
            <Text style={styles.spotAddress}>{selectedSpot.address}</Text>
            <Text style={styles.spotPrice}>${selectedSpot.hourly_rate}/hr</Text>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => handleBookSpot(selectedSpot)}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>
          {loading ? 'Loading...' : `${parkingSpots.length} Parking Spots Nearby`}
        </Text>
        <FlatList
          data={parkingSpots}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => setSelectedSpot(item)}
            >
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{item.title}</Text>
                <Text style={styles.listItemAddress}>{item.address}</Text>
              </View>
              <View>
                <Text style={styles.listItemPrice}>${item.hourly_rate}/hr</Text>
                <TouchableOpacity
                  style={styles.miniBookButton}
                  onPress={() => handleBookSpot(item)}
                >
                  <Text style={styles.miniBookButtonText}>Book</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <BookingModal
        visible={showBookingModal}
        spot={selectedSpot}
        onClose={() => setShowBookingModal(false)}
        onSuccess={handleBookingSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  map: {
    height: '40%',
  },
  spotInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotDetails: {
    flex: 1,
  },
  spotTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  spotAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  spotPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    padding: 15,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  listItemAddress: {
    fontSize: 14,
    color: '#666',
  },
  listItemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'right',
    marginBottom: 5,
  },
  miniBookButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 6,
  },
  miniBookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});