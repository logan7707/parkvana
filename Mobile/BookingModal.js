import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export default function BookingModal({ visible, spot, onClose, onSuccess }) {
  const [selectedHours, setSelectedHours] = useState(1);
  const [loading, setLoading] = useState(false);

  const hourOptions = [1, 2, 4, 8];

  const handleBook = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'You must be logged in to book parking');
        setLoading(false);
        return;
      }

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + selectedHours * 60 * 60 * 1000);

      const response = await api.createBooking(token, {
        parking_space_id: spot.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });

      Alert.alert(
        'Booking Confirmed! 🎉',
        `You've booked ${spot.title} for ${selectedHours} hour(s).\n\nTotal: $${(spot.hourly_rate * selectedHours).toFixed(2)}\n\n🇺🇸 Thanks! Your booking just helped feed a veteran.`,
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Book Parking</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Spot Info Card */}
          <View style={styles.spotInfoCard}>
            <Text style={styles.spotTitle}>{spot.title}</Text>
            <Text style={styles.spotAddress}>{spot.address}</Text>
            <Text style={styles.spotRate}>${spot.hourly_rate}/hour</Text>
          </View>

          {/* Duration Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How long?</Text>
            <View style={styles.hoursGrid}>
              {hourOptions.map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.hourButton,
                    selectedHours === hours && styles.hourButtonSelected,
                  ]}
                  onPress={() => setSelectedHours(hours)}
                  disabled={loading}
                  activeOpacity={0.8}
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

          {/* Price Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{selectedHours} hour(s)</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate:</Text>
              <Text style={styles.summaryValue}>${spot.hourly_rate}/hr</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${totalCost}</Text>
            </View>
          </View>

          {/* Veteran Mission */}
          <View style={styles.missionCard}>
            <Text style={styles.missionEmoji}>🇺🇸</Text>
            <Text style={styles.missionText}>Every booking feeds a veteran</Text>
          </View>

          {/* Book Button */}
          <TouchableOpacity
            style={[styles.bookButton, loading && styles.bookButtonDisabled]}
            onPress={handleBook}
            disabled={loading}
            activeOpacity={0.8}
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    fontSize: 28,
    color: '#999',
    fontWeight: '300',
  },
  spotInfoCard: {
    backgroundColor: '#e8f8f5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#3cba92',
  },
  spotTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  spotAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  spotRate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0ba360',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  hoursGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  hourButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  hourButtonSelected: {
    backgroundColor: '#0ba360',
  },
  hourButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  hourButtonTextSelected: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  summaryDivider: {
    height: 2,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0ba360',
  },
  missionCard: {
    backgroundColor: '#e8f8f5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0ba360',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  missionEmoji: {
    fontSize: 20,
  },
  missionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ba360',
    flex: 1,
  },
  bookButton: {
    backgroundColor: '#0ba360',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#0ba360',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});