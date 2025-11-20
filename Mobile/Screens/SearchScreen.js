import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function SearchScreen() {
  const [location, setLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [parkingSpots, setParkingSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);

  // Sample parking spots data (we'll connect to your backend later)
  const sampleSpots = [
    {
      id: 1,
      title: 'Downtown Parking',
      address: '123 Main St, Austin, TX',
      price: 5.00,
      latitude: 30.2672,
      longitude: -97.7431,
      available: true,
    },
    {
      id: 2,
      title: 'Airport Parking',
      address: '456 Airport Blvd, Austin, TX',
      price: 8.00,
      latitude: 30.1975,
      longitude: -97.6664,
      available: true,
    },
    {
      id: 3,
      title: 'University Parking',
      address: '789 University Ave, Austin, TX',
      price: 3.50,
      latitude: 30.2849,
      longitude: -97.7341,
      available: true,
    },
  ];

  useEffect(() => {
    getLocation();
    setParkingSpots(sampleSpots);
  }, []);

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need location permission to show nearby parking');
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
      // Default to Austin, TX if location fails
      setLocation({
        latitude: 30.2672,
        longitude: -97.7431,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  const handleSearch = () => {
    // TODO: Connect to backend API to search parking spots
    Alert.alert('Search', `Searching for parking near: ${searchQuery}`);
  };

  const handleBookSpot = (spot) => {
    Alert.alert(
      'Book Parking',
      `Would you like to book ${spot.title} for $${spot.price}/hr?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book Now', onPress: () => Alert.alert('Success', 'Booking feature coming soon!') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
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

      {/* Map View */}
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
                latitude: spot.latitude,
                longitude: spot.longitude,
              }}
              title={spot.title}
              description={`$${spot.price}/hr`}
              onPress={() => setSelectedSpot(spot)}
            />
          ))}
        </MapView>
      )}

      {/* Selected Spot Info */}
      {selectedSpot && (
        <View style={styles.spotInfo}>
          <View style={styles.spotDetails}>
            <Text style={styles.spotTitle}>{selectedSpot.title}</Text>
            <Text style={styles.spotAddress}>{selectedSpot.address}</Text>
            <Text style={styles.spotPrice}>${selectedSpot.price}/hr</Text>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => handleBookSpot(selectedSpot)}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Parking List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Nearby Parking</Text>
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
              <Text style={styles.listItemPrice}>${item.price}/hr</Text>
            </TouchableOpacity>
          )}
        />
      </View>
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
  },
});