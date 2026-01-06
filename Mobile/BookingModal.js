import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BookingModal({ visible, spot, onClose, onSuccess, navigation }) {
  const [rateType, setRateType] = useState('hourly');
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!spot) return null;

  // Available rate types based on what the space owner has set
  const availableRates = [
    { type: 'hourly', label: 'Hourly', rate: spot.hourly_rate, unit: 'hour(s)' },
    spot.daily_rate && { type: 'daily', label: 'Daily', rate: spot.daily_rate, unit: 'day(s)' },
    spot.weekly_rate && { type: 'weekly', label: 'Weekly', rate: spot.weekly_rate, unit: 'week(s)' },
    spot.monthly_rate && { type: 'monthly', label: 'Monthly', rate: spot.monthly_rate, unit: 'month(s)' },
  ].filter(Boolean);

  // Duration options based on rate type
  const getDurationOptions = () => {
    switch (rateType) {
      case 'hourly':
        return [1, 2, 4, 8, 12, 24];
      case 'daily':
        return [1, 2, 3, 7, 14, 30];
      case 'weekly':
        return [1, 2, 4, 8];
      case 'monthly':
        return [1, 2, 3, 6, 12];
      default:
        return [1];
    }
  };

  const getCurrentRate = () => {
    const selected = availableRates.find(r => r.type === rateType);
    return selected ? selected.rate : spot.hourly_rate;
  };

  const getCurrentUnit = () => {
    const selected = availableRates.find(r => r.type === rateType);
    return selected ? selected.unit : 'hour(s)';
  };

  const totalCost = (getCurrentRate() * selectedDuration).toFixed(2);

  const handleProceedToPayment = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'You must be logged in to book parking');
        return;
      }

      // Calculate start and end times based on rate type
      const startTime = new Date();
      let endTime = new Date();

      switch (rateType) {
        case 'hourly':
          endTime = new Date(startTime.getTime() + selectedDuration * 60 * 60 * 1000);
          break;
        case 'daily':
          endTime = new Date(startTime.getTime() + selectedDuration * 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          endTime = new Date(startTime.getTime() + selectedDuration * 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          endTime = new Date(startTime.getTime() + selectedDuration * 30 * 24 * 60 * 60 * 1000);
          break;
      }

      // Navigate to Payment screen
      navigation.navigate('Payment', {
        parking_space: spot,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        rate_type: rateType,
        duration: selectedDuration,
        amount: Math.round(parseFloat(totalCost) * 100), // Convert to cents
      });

      onClose();
    } catch (error) {
      console.error('Payment navigation error:', error);
      Alert.alert('Error', 'Could not proceed to payment. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
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
            </View>

            {/* Rate Type Selector */}
            {availableRates.length > 1 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Rate Type</Text>
                <View style={styles.rateTypeGrid}>
                  {availableRates.map((rate) => (
                    <TouchableOpacity
                      key={rate.type}
                      style={[
                        styles.rateTypeButton,
                        rateType === rate.type && styles.rateTypeButtonSelected,
                      ]}
                      onPress={() => {
                        setRateType(rate.type);
                        setSelectedDuration(1); // Reset duration when changing rate type
                      }}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.rateTypeLabel,
                          rateType === rate.type && styles.rateTypeLabelSelected,
                        ]}
                      >
                        {rate.label}
                      </Text>
                      <Text
                        style={[
                          styles.rateTypePrice,
                          rateType === rate.type && styles.rateTypePriceSelected,
                        ]}
                      >
                        ${rate.rate}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Duration Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How long?</Text>
              <View style={styles.durationGrid}>
                {getDurationOptions().map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      selectedDuration === duration && styles.durationButtonSelected,
                    ]}
                    onPress={() => setSelectedDuration(duration)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.durationButtonText,
                        selectedDuration === duration && styles.durationButtonTextSelected,
                      ]}
                    >
                      {duration}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>{selectedDuration} {getCurrentUnit()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rate:</Text>
                <Text style={styles.summaryValue}>${getCurrentRate()}/{rateType === 'hourly' ? 'hr' : rateType === 'daily' ? 'day' : rateType === 'weekly' ? 'wk' : 'mo'}</Text>
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

            {/* Proceed Button */}
            <TouchableOpacity
              style={[styles.proceedButton, loading && styles.proceedButtonDisabled]}
              onPress={handleProceedToPayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
  rateTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rateTypeButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  rateTypeButtonSelected: {
    backgroundColor: '#e8f8f5',
    borderColor: '#0ba360',
  },
  rateTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  rateTypeLabelSelected: {
    color: '#0ba360',
  },
  rateTypePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  rateTypePriceSelected: {
    color: '#0ba360',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  durationButtonSelected: {
    backgroundColor: '#0ba360',
  },
  durationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  durationButtonTextSelected: {
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
  proceedButton: {
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
  proceedButtonDisabled: {
    opacity: 0.6,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});