import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PaymentScreen = ({ route, navigation }) => {
  const { parking_space, start_time, end_time } = route.params;
  const { createPaymentMethod } = useStripe();
  
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  // Calculate total price
  const calculatePrice = () => {
    const start = new Date(start_time);
    const end = new Date(end_time);
    const hours = (end - start) / (1000 * 60 * 60);
    return (hours * parking_space.hourly_rate).toFixed(2);
  };

  const totalPrice = parseFloat(calculatePrice());

  const handlePayment = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please complete your card information');
      return;
    }

    setLoading(true);

    try {
      // Create payment method
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: 'Card'
      });

      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }

      // Get auth token
      const token = await AsyncStorage.getItem('userToken');

      // Create booking with payment
      const response = await fetch(
        'https://parkvana-production.up.railway.app/api/bookings/create-with-payment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            parking_space_id: parking_space.id,
            start_time,
            end_time,
            payment_method_id: paymentMethod.id
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          'Success!',
          'Your booking is confirmed! $1 donated to feed veterans.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Main')
            }
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Booking Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{parking_space.address}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.label}>Start:</Text>
          <Text style={styles.value}>
            {new Date(start_time).toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.label}>End:</Text>
          <Text style={styles.value}>
            {new Date(end_time).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Price Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Breakdown</Text>
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalPrice}</Text>
        </View>
        <Text style={styles.veteranNote}>
          🇺🇸 $1 from this booking feeds a veteran in need
        </Text>
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <CardField
          postalCodeEnabled={true}
          placeholders={{
            number: '4242 4242 4242 4242'
          }}
          cardStyle={styles.card}
          style={styles.cardField}
          onCardChange={(cardDetails) => {
            setCardComplete(cardDetails.complete);
          }}
        />
      </View>

      {/* Pay Button */}
      <TouchableOpacity
        style={[
          styles.payButton,
          (!cardComplete || loading) && styles.payButtonDisabled
        ]}
        onPress={handlePayment}
        disabled={!cardComplete || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payButtonText}>
            Pay ${totalPrice} & Book Now
          </Text>
        )}
      </TouchableOpacity>

      {/* Security Note */}
      <Text style={styles.securityNote}>
        🔒 Secure payment powered by Stripe
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ba360',
    marginBottom: 15
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right'
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ba360'
  },
  veteranNote: {
    fontSize: 12,
    color: '#0ba360',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center'
  },
  cardField: {
    height: 50,
    marginTop: 10
  },
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8
  },
  payButton: {
    backgroundColor: '#0ba360',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15
  },
  payButtonDisabled: {
    backgroundColor: '#ccc'
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  securityNote: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
    marginBottom: 30
  }
});

export default PaymentScreen;