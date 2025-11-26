import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';

export default function ProfileScreen({ navigation }) {
  const user = {
    first_name: 'Alex',
    last_name: 'Long',
    email: 'alex@test.com',
    user_type: 'driver',
    member_since: 'November 2025',
    total_bookings: 12,
    total_spent: 96,
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with Gradient */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user.first_name[0]}{user.last_name[0]}
          </Text>
        </View>
        <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user.total_bookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>${user.total_spent}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>

        {/* Our Mission Section */}
        <View style={styles.missionSection}>
          <Text style={styles.missionTitle}>🇺🇸 Our Mission</Text>
          <Text style={styles.missionText}>
            Every booking on Parkvana helps feed a veteran in need. We donate $1 from every parking reservation to support Austin veterans through our partnership with local veteran organizations.
          </Text>
          <Text style={styles.missionSubtext}>
            Thank you for parking with purpose and supporting those who served.
          </Text>
        </View>

        {/* Account Information */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Type</Text>
            <Text style={styles.infoValue}>{user.user_type}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>{user.member_since}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          {[
            { icon: '📝', label: 'Edit Profile' },
            { icon: '🅿️', label: 'My Listed Spaces' },
            { icon: '💳', label: 'Payment Methods' },
            { icon: '⚙️', label: 'Settings' },
            { icon: '❓', label: 'Help & Support' },
          ].map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                index < 4 && styles.actionButtonBorder,
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>
                {action.icon} {action.label}
              </Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Parkvana v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0ba360',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0ba360',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: -30,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0ba360',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  missionSection: {
    backgroundColor: '#e8f8f5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0ba360',
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0ba360',
    marginBottom: 12,
  },
  missionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  missionSubtext: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  actionButtonBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
  },
  actionArrow: {
    fontSize: 18,
    color: '#0ba360',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginBottom: 30,
  },
});