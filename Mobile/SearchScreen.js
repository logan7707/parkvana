import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { api } from './api';
import BookingModal from './BookingModal';

export default function SearchScreen({ navigation }) {
  const [region, setRegion] = useState({
    latitude: 30.2672,
    longitude: -97.7431,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [mapRef, setMapRef] = useState(null);

  const loadSpots = async () => {
    try {
      setLoading(true);

      const response = await api.searchSpots(
        region.latitude,
        region.longitude,
        10000
      );

      setSpots(response.spots || []);
    } catch (error) {
      console.error('Error loading spots:', error);
      Alert.alert('Error', 'Could not load parking spots');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSpots();
    }, [])
  );

  const handleMarkerPress = (spot) => {
    setSelectedSpot(spot);
    setModalVisible(true);
  };

  const handleLocateMe = async () => {
    try {
      setLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please enable location permissions in your settings to use this feature.'
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setRegion(newRegion);

      setTimeout(() => {
        if (mapRef) {
          mapRef.animateToRegion(newRegion, 1000);
        }
      }, 100);

      const response = await api.searchSpots(
        location.coords.latitude,
        location.coords.longitude,
        10000
      );

      setSpots(response.spots || []);
      
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Could not get your location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={(ref) => setMapRef(ref)}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{
              latitude: parseFloat(spot.latitude),
              longitude: parseFloat(spot.longitude),
            }}
            onPress={() => handleMarkerPress(spot)}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerPrice}>${spot.hourly_rate}/hr</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity
        style={styles.locateMeButton}
        onPress={handleLocateMe}
        disabled={loading}
      >
        <Text style={styles.locateMeIcon}>📍</Text>
        <Text style={styles.locateMeText}>Locate Me</Text>
      </TouchableOpacity>

      <BookingModal
        visible={modalVisible}
        spot={selectedSpot}
        navigation={navigation}
        onClose={() => {
          setModalVisible(false);
          setSelectedSpot(null);
        }}
        onSuccess={() => {
          setModalVisible(false);
          setSelectedSpot(null);
          loadSpots();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: '#0ba360',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerPrice: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  locateMeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#0ba360',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  locateMeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  locateMeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});