import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PaymentMethodsScreen({ navigation }) {
  const { createPaymentMethod } = useStripe();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addCardModalVisible, setAddCardModalVisible] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [addingCard, setAddingCard] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(
        'https://parkvana-production.up.railway.app/api/payment-methods',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert('Error', 'Could not load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please complete your card details');
      return;
    }

    try {
      setAddingCard(true);

      // Create payment method with Stripe
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Save payment method to backend
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        'https://parkvana-production.up.railway.app/api/payment-methods',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            payment_method_id: paymentMethod.id,
          }),
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'Card added successfully');
        setAddCardModalVisible(false);
        loadPaymentMethods();
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Could not add card');
      }
    } catch (error) {
      console.error('Error adding card:', error);
      Alert.alert('Error', 'Could not add card');
    } finally {
      setAddingCard(false);
    }
  };

  const handleDeleteCard = async (paymentMethodId) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to remove this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              const response = await fetch(
                `https://parkvana-production.up.railway.app/api/payment-methods/${paymentMethodId}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                Alert.alert('Success', 'Card removed');
                loadPaymentMethods();
              } else {
                Alert.alert('Error', 'Could not remove card');
              }
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Could not remove card');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (paymentMethodId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        `https://parkvana-production.up.railway.app/api/payment-methods/${paymentMethodId}/set-default`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        Alert.alert('Success', 'Default card updated');
        loadPaymentMethods();
      } else {
        Alert.alert('Error', 'Could not set default card');
      }
    } catch (error) {
      console.error('Error setting default:', error);
      Alert.alert('Error', 'Could not set default card');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ba360" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <Text style={styles.headerSubtitle}>
          Manage your saved cards
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💳</Text>
            <Text style={styles.emptyTitle}>No Cards Saved</Text>
            <Text style={styles.emptySubtitle}>
              Add a card for faster checkout on your next booking
            </Text>
          </View>
        ) : (
          paymentMethods.map((pm) => (
            <View key={pm.id} style={styles.cardContainer}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardBrand}>
                  {pm.card.brand.toUpperCase()} •••• {pm.card.last4}
                </Text>
                <Text style={styles.cardExpiry}>
                  Expires {pm.card.exp_month}/{pm.card.exp_year}
                </Text>
                {pm.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardActions}>
                {!pm.is_default && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSetDefault(pm.id)}
                  >
                    <Text style={styles.actionButtonText}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteCard(pm.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Card Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setAddCardModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add New Card</Text>
      </TouchableOpacity>

      {/* Add Card Modal */}
      <Modal
        visible={addCardModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddCardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Card</Text>

            <CardField
              postalCodeEnabled={true}
              placeholders={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={styles.cardFieldStyle}
              style={styles.cardField}
              onCardChange={(cardDetails) => {
                setCardComplete(cardDetails.complete);
              }}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAddCardModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  (!cardComplete || addingCard) && styles.saveButtonDisabled,
                ]}
                onPress={handleAddCard}
                disabled={!cardComplete || addingCard}
              >
                {addingCard ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Add Card</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInfo: {
    marginBottom: 15,
  },
  cardBrand: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  cardExpiry: {
    fontSize: 14,
    color: '#666',
  },
  defaultBadge: {
    backgroundColor: '#0ba360',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  defaultText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deleteButton: {
    backgroundColor: '#fee',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f44336',
  },
  addButton: {
    backgroundColor: '#0ba360',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0ba360',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  cardField: {
    height: 50,
    marginBottom: 20,
  },
  cardFieldStyle: {
    backgroundColor: '#f8f8f8',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#0ba360',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});