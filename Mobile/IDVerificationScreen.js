import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStripeIdentity } from '@stripe/stripe-identity-react-native';

export default function IDVerificationScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState('unverified');
  const { present, loading: identityLoading } = useStripeIdentity();

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        'https://parkvana-production.up.railway.app/api/verification/status',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      setVerificationStatus(data.verification_status);
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startVerification = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(
        'https://parkvana-production.up.railway.app/api/verification/create-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Present Stripe Identity Sheet
        const { error } = await present(data.clientSecret);

        if (error) {
          Alert.alert('Verification Failed', error.message);
        } else {
          Alert.alert(
            'Verification Submitted',
            'Your ID is being verified. This usually takes a few minutes.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to start verification');
      }
    } catch (error) {
      console.error('Start verification error:', error);
      Alert.alert('Error', 'Failed to start verification');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'verified':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'requires_input':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Verification Pending';
      case 'requires_input':
        return 'Action Required';
      default:
        return 'Not Verified';
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'requires_input':
        return 'alert-circle';
      default:
        return 'shield-outline';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ba360" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ID Verification</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
          <Ionicons name={getStatusIcon()} size={60} color={getStatusColor()} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why verify your ID?</Text>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={24} color="#0ba360" />
            <Text style={styles.infoText}>Build trust with renters and space owners</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="lock-closed" size={24} color="#0ba360" />
            <Text style={styles.infoText}>Secure transactions and prevent fraud</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="star" size={24} color="#0ba360" />
            <Text style={styles.infoText}>Access exclusive verified member benefits</Text>
          </View>
        </View>

        {/* What to Prepare */}
        {verificationStatus === 'unverified' && (
          <View style={styles.prepareSection}>
            <Text style={styles.prepareTitle}>What you'll need:</Text>
            <Text style={styles.prepareText}>• Government-issued ID (Driver's License, Passport, etc.)</Text>
            <Text style={styles.prepareText}>• Good lighting</Text>
            <Text style={styles.prepareText}>• 2-3 minutes</Text>
          </View>
        )}

        {/* Action Button */}
        {verificationStatus === 'unverified' && (
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={startVerification}
            disabled={identityLoading}
          >
            {identityLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify My ID</Text>
            )}
          </TouchableOpacity>
        )}

        {verificationStatus === 'pending' && (
          <View style={styles.pendingMessage}>
            <Text style={styles.pendingText}>
              Your ID is being verified. This usually takes a few minutes. We'll notify you when it's complete!
            </Text>
          </View>
        )}

        {verificationStatus === 'verified' && (
          <View style={styles.verifiedMessage}>
            <Text style={styles.verifiedText}>
              ✓ Your ID has been verified! You now have full access to all Parkvana features.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 15,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ba360',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  prepareSection: {
    backgroundColor: '#e8f8f5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0ba360',
  },
  prepareTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0ba360',
    marginBottom: 10,
  },
  prepareText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  verifyButton: {
    backgroundColor: '#0ba360',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  pendingMessage: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  pendingText: {
    fontSize: 15,
    color: '#92400E',
    lineHeight: 22,
  },
  verifiedMessage: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  verifiedText: {
    fontSize: 15,
    color: '#065F46',
    lineHeight: 22,
  },
});