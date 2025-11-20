import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { api } from './api';

export default function AddSpaceScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [spaceType, setSpaceType] = useState('parking_lot');
  const [loading, setLoading] = useState(false);

  const spaceTypes = [
    { label: 'Parking Lot', value: 'parking_lot' },
    { label: 'Garage', value: 'garage' },
    { label: 'Driveway', value: 'driveway' },
    { label: 'Street', value: 'street' },
    { label: 'Other', value: 'other' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!title || !description || !address || !city || !state || !zipCode || !hourlyRate) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isNaN(parseFloat(hourlyRate)) || parseFloat(hourlyRate) <= 0) {
      Alert.alert('Error', 'Please enter a valid hourly rate');
      return;
    }

    setLoading(true);
    try {
      // Get coordinates from address
      const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
      const geocoded = await Location.geocodeAsync(fullAddress);
      
      if (geocoded.length === 0) {
        Alert.alert('Error', 'Could not find location. Please check the address.');
        setLoading(false);
        return;
      }

      const { latitude, longitude } = geocoded[0];

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'You must be logged in to add a parking space');
        setLoading(false);
        return;
      }

      console.log('Creating parking space with token:', token.substring(0, 20) + '...');

      // Create parking space via API
      const response = await api.createParkingSpace(token, {
        title,
        description,
        address,
        city,
        state,
        zip_code: zipCode,
        hourly_rate: parseFloat(hourlyRate),
        space_type: spaceType,
        latitude,
        longitude,
      });

      console.log('Space created successfully:', response);

      Alert.alert(
        'Success!',
        'Your parking space has been listed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear form
              setTitle('');
              setDescription('');
              setAddress('');
              setCity('');
              setState('');
              setZipCode('');
              setHourlyRate('');
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error adding parking space:', error);
      Alert.alert('Error', error.message || 'Could not add parking space. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>List Your Parking Space</Text>
        <Text style={styles.subheader}>Earn money by renting out your parking spot!</Text>

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Downtown Covered Parking"
          value={title}
          onChangeText={setTitle}
          editable={!loading}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your parking space..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          editable={!loading}
        />

        <Text style={styles.label}>Street Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="123 Main St"
          value={address}
          onChangeText={setAddress}
          editable={!loading}
        />

        <Text style={styles.label}>City *</Text>
        <TextInput
          style={styles.input}
          placeholder="Austin"
          value={city}
          onChangeText={setCity}
          editable={!loading}
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              placeholder="TX"
              value={state}
              onChangeText={setState}
              maxLength={2}
              autoCapitalize="characters"
              editable={!loading}
            />
          </View>

          <View style={styles.halfWidth}>
            <Text style={styles.label}>Zip Code *</Text>
            <TextInput
              style={styles.input}
              placeholder="78701"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
              maxLength={5}
              editable={!loading}
            />
          </View>
        </View>

        <Text style={styles.label}>Hourly Rate ($) *</Text>
        <TextInput
          style={styles.input}
          placeholder="10.00"
          value={hourlyRate}
          onChangeText={setHourlyRate}
          keyboardType="decimal-pad"
          editable={!loading}
        />

        <Text style={styles.label}>Space Type *</Text>
        <View style={styles.spaceTypeContainer}>
          {spaceTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.spaceTypeButton,
                spaceType === type.value && styles.spaceTypeButtonSelected,
              ]}
              onPress={() => setSpaceType(type.value)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.spaceTypeText,
                  spaceType === type.value && styles.spaceTypeTextSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>List My Space</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#007AFF',
  },
  subheader: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  spaceTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  spaceTypeButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 10,
    marginBottom: 10,
  },
  spaceTypeButtonSelected: {
    backgroundColor: '#007AFF',
  },
  spaceTypeText: {
    color: '#007AFF',
    fontSize: 14,
  },
  spaceTypeTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 10,
    marginTop: 30,
    marginBottom: 30,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});