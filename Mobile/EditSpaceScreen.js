import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditSpaceScreen({ route, navigation }) {
  const { space } = route.params;

  const [formData, setFormData] = useState({
    title: space.title || '',
    address: space.address || '',
    hourly_rate: space.hourly_rate?.toString() || '',
    space_type: space.space_type || 'driveway',
    description: space.description || '',
    features: space.features || '',
  });

  const [loading, setLoading] = useState(false);

  const spaceTypes = [
    { value: 'driveway', label: '🏠 Driveway' },
    { value: 'garage', label: '🚗 Garage' },
    { value: 'carport', label: '🏗️ Carport' },
    { value: 'street', label: '🛣️ Street Parking' },
    { value: 'lot', label: '🅿️ Parking Lot' },
  ];

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!formData.address.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }

    if (!formData.hourly_rate || parseFloat(formData.hourly_rate) <= 0) {
      Alert.alert('Error', 'Please enter a valid hourly rate');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(
        `https://parkvana-production.up.railway.app/api/spots/${space.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title.trim(),
            address: formData.address.trim(),
            hourly_rate: parseFloat(formData.hourly_rate),
            space_type: formData.space_type,
            description: formData.description.trim(),
            features: formData.features.trim() || null,
          }),
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'Space updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Could not update space');
      }
    } catch (error) {
      console.error('Error updating space:', error);
      Alert.alert('Error', 'Could not update space');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Space</Text>
        </View>

        <View style={styles.form}>
          {/* Title */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Space Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Covered Driveway Near Downtown"
              value={formData.title}
              onChangeText={(text) =>
                setFormData({ ...formData, title: text })
              }
              maxLength={100}
            />
          </View>

          {/* Address */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 123 Main St, Austin, TX 78701"
              value={formData.address}
              onChangeText={(text) =>
                setFormData({ ...formData, address: text })
              }
              maxLength={200}
            />
            <Text style={styles.helperText}>
              Note: Changing the address won't update the map location
            </Text>
          </View>

          {/* Hourly Rate */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Hourly Rate ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 5"
              value={formData.hourly_rate}
              onChangeText={(text) =>
                setFormData({ ...formData, hourly_rate: text })
              }
              keyboardType="decimal-pad"
              maxLength={6}
            />
          </View>

          {/* Space Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Space Type *</Text>
            <View style={styles.radioGroup}>
              {spaceTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.radioButton,
                    formData.space_type === type.value &&
                      styles.radioButtonSelected,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, space_type: type.value })
                  }
                >
                  <Text
                    style={[
                      styles.radioButtonText,
                      formData.space_type === type.value &&
                        styles.radioButtonTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional details about your parking space..."
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* Features */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Features (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Covered, EV Charging, Security Camera"
              value={formData.features}
              onChangeText={(text) =>
                setFormData({ ...formData, features: text })
              }
              maxLength={200}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0ba360',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  form: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  helperText: {
    fontSize: 13,
    color: '#999',
    marginTop: 5,
  },
  radioGroup: {
    gap: 10,
  },
  radioButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  radioButtonSelected: {
    borderColor: '#0ba360',
    backgroundColor: '#e8f8f5',
  },
  radioButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  radioButtonTextSelected: {
    color: '#0ba360',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#0ba360',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
    shadowColor: '#0ba360',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});