import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export default function BookingModal({ visible, spot, onClose, onSuccess }) {
  const [selectedHours, setSelectedHours] = useState(1);
  const [loading, setLoading] = useState(false);

  const hourOptions = [1, 2, 3, 4, 5, 6, 8, 12, 24];

  const handleBook = async () => {
    setLoading(true);
    try {
      // Get token
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'You must be logged in to book parking');
        setLoading(false);
        return;
      }

      // Calculate start and end times
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + selectedHours * 60 * 60 * 1000);

      console.log('Creating booking:', {
        spot: spot.id,
        hours: selectedHours,
        start: startTime.toISOString(),
        end: endTime.toISOString(),
      });

      // Create booking via API
      const response = await api.createBooking(token, {
        parking_space_id: spot.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });

      console.log('Booking created:', response);

      Alert.alert(
        'Booking Confirmed!',
        `You've booked ${spot.title} for ${selectedHours} hour(s).\n\nTotal: $${(spot.hourly_rate * selectedHours).toFixed(2)}`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              if (onSuccess) onSuccess();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Booking Failed', error.message || 'Could not create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!spot) return null;

  const totalCost = (spot.hourly_rate * selectedHours).toFixed(2);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Book Parking</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spotInfo}>
            <Text style={styles.spotTitle}>{spot.title}</Text>
            <Text style={styles.spotAddress}>{spot.address}</Text>
            <Text style={styles.spotRate}>${spot.hourly_rate}/hour</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How long do you need parking?</Text>
            <View style={styles.hoursContainer}>
              {hourOptions.map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.hourButton,
                    selectedHours === hours && styles.hourButtonSelected,
                  ]}
                  onPress={() => setSelectedHours(hours)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.hourButtonText,
                      selectedHours === hours && styles.hourButtonTextSelected,
                    ]}
                  >
                    {hours}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{selectedHours} hour(s)</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate:</Text>
              <Text style={styles.summaryValue}>${spot.hourly_rate}/hr</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${totalCost}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.bookButton, loading && styles.bookButtonDisabled]}
            onPress={handleBook}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 28,
    color: '#999',
  },
  spotInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  spotTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  spotAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  spotRate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  hoursContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  hourButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    minWidth: 70,
    alignItems: 'center',
  },
  hourButtonSelected: {
    backgroundColor: '#007AFF',
  },
  hourButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  hourButtonTextSelected: {
    color: '#fff',
  },
  summary: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
    marginTop: 5,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});