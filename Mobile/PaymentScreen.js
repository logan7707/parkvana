import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PaymentScreen({ route, navigation }) {
  const { parking_space, start_time, end_time } = route.params;
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const startDate = new Date(start_time);
  const endDate = new Date(end_time);
  const hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
  const totalPrice = (parking_space.hourly_rate * hours).toFixed(2);

  const handlePayment = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please complete your card details');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'You must be logged in');
        setLoading(false);
        return;
      }

      console.log('=== Starting payment process ===');
      console.log('Amount to charge:', totalPrice);

      // Step 1: Create payment intent on backend
      const response = await fetch('https://parkvana-production.up.railway.app/api/bookings/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          parking_space_id: parking_space.id,
          start_time,
          end_time,
          amount: Math.round(parseFloat(totalPrice) * 100), // Stripe uses cents
        }),
      });

      console.log('Payment intent response status:', response.status);

      // Check what we actually got back
      const responseText = await response.text();
      console.log('Raw response:', responseText.substring(0, 200)); // First 200 chars

      if (!response.ok) {
        console.error('Response not OK. Status:', response.status);
        console.error('Response body:', responseText);
        throw new Error(`Server error: ${response.status}`);
      }

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error. Response was:', responseText);
        throw new Error('Server returned invalid response');
      }

      const { clientSecret, bookingId } = data;
      console.log('Booking ID received:', bookingId);
      console.log('Client secret received:', clientSecret ? 'Yes' : 'No');

      // Step 2: Confirm payment with Stripe
      console.log('=== Confirming payment with Stripe ===');
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        console.log('Stripe payment error:', error);
        Alert.alert('Payment Failed', error.message);
        setLoading(false);
        return;
      }

      console.log('Stripe payment succeeded!');
      console.log('Payment Intent ID:', paymentIntent.id);

      // Step 3: Confirm booking on backend
      console.log('=== Confirming booking ===');
      console.log('Booking ID:', bookingId);
      console.log('Payment Intent ID:', paymentIntent.id);
      
      const confirmResponse = await fetch('https://parkvana-production.up.railway.app/api/bookings/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: bookingId,
          payment_intent_id: paymentIntent.id,
        }),
      });

      console.log('Confirm response status:', confirmResponse.status);

      const confirmText = await confirmResponse.text();
      console.log('Confirm raw response:', confirmText.substring(0, 200));

      if (!confirmResponse.ok) {
        console.error('Confirm response not OK:', confirmText);
        throw new Error(`Failed to confirm booking: ${confirmResponse.status}`);
      }

      let confirmData;
      try {
        confirmData = JSON.parse(confirmText);
      } catch (parseError) {
        console.error('Confirm JSON parse error. Response was:', confirmText);
        throw new Error('Server returned invalid confirmation response');
      }

      console.log('Confirm success data:', confirmData);
      console.log('=== Booking complete! ===');

      // Success!
      Alert.alert(
        'Booking Confirmed! 🎉',
        'View or cancel this parking reservation in the My Bookings tab.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );

    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Summary</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{parking_space.address}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Duration:</Text>
          <Text style={styles.value}>{hours} hour(s)</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Rate:</Text>
          <Text style={styles.value}>${parking_space.hourly_rate}/hr</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Breakdown</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Parking ({hours}hr)</Text>
          <Text style={styles.value}>${totalPrice}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalPrice}</Text>
        </View>

        <Text style={styles.note}>🇺🇸 Every booking supports veterans</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        <CardField
          postalCodeEnabled={true}
          placeholders={{
            number: '4242 4242 4242 4242',
          }}
          cardStyle={styles.card}
          style={styles.cardField}
          onCardChange={(cardDetails) => {
            setCardComplete(cardDetails.complete);
          }}
        />
      </View>

      <TouchableOpacity
        style={[styles.payButton, (!cardComplete || loading) && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={!cardComplete || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payButtonText}>Pay ${totalPrice} & Book Now</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.securityNote}>🔒 Secure payment powered by Stripe</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ba360',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ba360',
  },
  note: {
    fontSize: 12,
    color: '#0ba360',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  cardField: {
    height: 50,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#f8f8f8',
  },
  payButton: {
    backgroundColor: '#0ba360',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  securityNote: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
    marginBottom: 30,
  },
});