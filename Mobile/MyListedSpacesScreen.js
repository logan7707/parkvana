import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export default function MyListedSpacesScreen({ navigation }) {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListedSpaces();
  }, []);

  const loadListedSpaces = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      // Fetch user's listed spaces from API
      const response = await fetch('https://parkvana-production.up.railway.app/api/spots/my-spaces', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      setSpaces(data.spaces || []);
    } catch (error) {
      console.error('Error loading spaces:', error);
      Alert.alert('Error', 'Could not load your listed spaces');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (spaceId, currentStatus) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`https://parkvana-production.up.railway.app/api/spots/${spaceId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ available: !currentStatus }),
      });
      
      if (response.ok) {
        loadListedSpaces(); // Reload the list
        Alert.alert('Success', `Space ${!currentStatus ? 'activated' : 'deactivated'}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update space');
    }
  };

  const renderSpace = ({ item }) => (
    <View style={styles.spaceCard}>
      <View style={styles.spaceHeader}>
        <View style={styles.spaceIcon}>
          <Text style={styles.spaceIconEmoji}>🅿️</Text>
        </View>
        <View style={styles.spaceInfo}>
          <Text style={styles.spaceTitle}>{item.title}</Text>
          <Text style={styles.spaceAddress} numberOfLines={1}>{item.address}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.available ? '#0ba360' : '#999' }
        ]}>
          <Text style={styles.statusText}>
            {item.available ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.spaceDivider} />

      <View style={styles.spaceDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💵 Hourly Rate:</Text>
          <Text style={styles.detailValue}>${item.hourly_rate}/hr</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 Type:</Text>
          <Text style={styles.detailValue}>{item.space_type}</Text>
        </View>
      </View>

      <View style={styles.spaceActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.toggleButton]}
          onPress={() => toggleAvailability(item.id, item.available)}
        >
          <Text style={styles.actionButtonText}>
            {item.available ? '⏸️ Deactivate' : '▶️ Activate'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => Alert.alert('Coming Soon', 'Edit functionality will be available soon')}
        >
          <Text style={styles.editButtonText}>✏️ Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ba360" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Listed Spaces</Text>
        <Text style={styles.headerSubtitle}>
          {spaces.length} space(s) listed
        </Text>
      </View>

      {spaces.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🅿️</Text>
          <Text style={styles.emptyTitle}>No Spaces Listed</Text>
          <Text style={styles.emptySubtitle}>
            List your driveway or parking space to start earning passive income!
          </Text>
          <TouchableOpacity
            style={styles.listButton}
            onPress={() => navigation.navigate('AddSpace')}
          >
            <Text style={styles.listButtonText}>+ List Your First Space</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={spaces}
          renderItem={renderSpace}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  listButton: {
    backgroundColor: '#0ba360',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  listButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
  },
  spaceCard: {
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
  spaceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  spaceIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#e8f8f5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  spaceIconEmoji: {
    fontSize: 24,
  },
  spaceInfo: {
    flex: 1,
  },
  spaceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  spaceAddress: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  spaceDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 15,
  },
  spaceDetails: {
    gap: 10,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  spaceActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#0ba360',
  },
  editButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
