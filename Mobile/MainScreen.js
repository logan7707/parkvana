import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function MainScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Veteran Banner */}
      <View style={styles.veteranBanner}>
        <Text style={styles.veteranText}>🇺🇸 Every booking feeds a veteran</Text>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.title}>🅿️ Parkvana</Text>
        <Text style={styles.subtitle}>Find parking anywhere, anytime</Text>
      </View>

      {/* Main Action Cards */}
      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.primaryCard}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <View>
              <Text style={styles.cardEmoji}>🔍</Text>
              <Text style={styles.cardTitle}>Find Parking</Text>
              <Text style={styles.cardSubtitle}>Search nearby spots</Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryCard}
          onPress={() => navigation.navigate('AddSpace')}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <View>
              <Text style={styles.cardEmoji}>➕</Text>
              <Text style={styles.cardTitle}>List Your Space</Text>
              <Text style={styles.cardSubtitle}>Earn $50-200/month</Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryCard}
          onPress={() => navigation.navigate('Bookings')}
          activeOpacity={0.8}
        >
          <View style={styles.secondaryCardContent}>
            <Text style={styles.secondaryCardTitle}>📋 My Bookings</Text>
            <Text style={styles.secondaryCardSubtitle}>View and manage reservations</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryCard}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <View style={styles.secondaryCardContent}>
            <Text style={styles.secondaryCardTitle}>👤 Profile</Text>
            <Text style={styles.secondaryCardSubtitle}>Account settings & info</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>1,247</Text>
          <Text style={styles.statLabel}>Active Spots</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>$3,421</Text>
          <Text style={styles.statLabel}>Fed Veterans</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0ba360',
  },
  contentContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  veteranBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    alignSelf: 'center',
  },
  veteranText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ba360',
    textAlign: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cardsContainer: {
    gap: 15,
    marginBottom: 30,
  },
  primaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  cardArrow: {
    fontSize: 24,
    color: '#0ba360',
    fontWeight: '600',
  },
  secondaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryCardContent: {
    gap: 6,
  },
  secondaryCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});