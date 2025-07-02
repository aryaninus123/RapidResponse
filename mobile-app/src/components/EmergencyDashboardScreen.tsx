import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Emergency, EmergencyStats, ServiceAvailability } from '../types/emergency';
import { apiService } from '../services/api';
import Toast from 'react-native-toast-message';

interface EmergencyDashboardScreenProps {
  navigation: any;
}

export function EmergencyDashboardScreen({ navigation }: EmergencyDashboardScreenProps) {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [stats, setStats] = useState<EmergencyStats | null>(null);
  const [services, setServices] = useState<ServiceAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [emergencyData, statsData, serviceData] = await Promise.all([
        apiService.getEmergencyHistory({ limit: 10 }),
        apiService.getEmergencyStats('24h'),
        apiService.getServiceAvailability(),
      ]);

      setEmergencies(emergencyData);
      setStats(statsData);
      setServices(serviceData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Toast.show({
        type: 'error',
        text1: 'Dashboard Error',
        text2: 'Failed to load emergency data',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'FIRE': return '🔥';
      case 'MEDICAL': return '🚑';
      case 'CRIME': return '🚨';
      case 'NATURAL_DISASTER': return '⛈️';
      case 'TRAFFIC': return '🚗';
      default: return '⚠️';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#dc2626';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#dc2626';
      case 'RESOLVED': return '#16a34a';
      case 'CANCELLED': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="hourglass-empty" size={48} color="#6b7280" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Stats Overview */}
      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Emergency Statistics (24h)</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
                             <MaterialIcons name="warning" size={24} color="#dc2626" />
              <Text style={styles.statNumber}>{stats.total_emergencies}</Text>
              <Text style={styles.statLabel}>Total Emergencies</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="timer" size={24} color="#3b82f6" />
              <Text style={styles.statNumber}>{stats.average_response_time.toFixed(1)}m</Text>
              <Text style={styles.statLabel}>Avg Response</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="trending-up" size={24} color="#16a34a" />
              <Text style={styles.statNumber}>{(stats.success_rate * 100).toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
            
            <View style={styles.statCard}>
              <MaterialIcons name="people" size={24} color="#7c3aed" />
              <Text style={styles.statNumber}>{services.length}</Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent Emergencies */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Emergencies</Text>
        {emergencies.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="check-circle" size={48} color="#16a34a" />
            <Text style={styles.emptyStateText}>No recent emergencies</Text>
            <Text style={styles.emptyStateSubtext}>All clear in your area</Text>
          </View>
        ) : (
          emergencies.map((emergency) => (
            <TouchableOpacity
              key={emergency.id}
              style={styles.emergencyCard}
              onPress={() => navigation.navigate('EmergencyDetails', { emergency })}
            >
              <View style={styles.emergencyHeader}>
                <View style={styles.emergencyInfo}>
                  <Text style={styles.emergencyIcon}>
                    {getEmergencyIcon(emergency.emergency_type)}
                  </Text>
                  <View style={styles.emergencyDetails}>
                    <Text style={styles.emergencyType}>
                      {emergency.emergency_type.replace('_', ' ')}
                    </Text>
                    <Text style={styles.emergencyTime}>
                      {new Date(emergency.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.emergencyBadges}>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(emergency.priority_level) }
                  ]}>
                    <Text style={styles.badgeText}>{emergency.priority_level}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(emergency.status) }
                  ]}>
                    <Text style={styles.badgeText}>{emergency.status}</Text>
                  </View>
                </View>
              </View>
              
              {emergency.location_lat && emergency.location_lon && (
                <View style={styles.locationInfo}>
                  <MaterialIcons name="location-on" size={16} color="#6b7280" />
                  <Text style={styles.locationText}>
                    {emergency.location_lat.toFixed(4)}, {emergency.location_lon.toFixed(4)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Service Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Status</Text>
        {services.map((service) => (
          <View key={service.id} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{service.service_type}</Text>
              <View style={[
                styles.serviceStatus,
                { backgroundColor: service.status === 'active' ? '#16a34a' : 
                  service.status === 'limited' ? '#f59e0b' : '#dc2626' }
              ]}>
                <Text style={styles.serviceStatusText}>
                  {service.status.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceDetail}>
                Available Units: {service.available_units}
              </Text>
              <Text style={styles.serviceDetail}>
                Avg Response: {service.average_response_time}m
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  emergencyCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  emergencyInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  emergencyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  emergencyDetails: {
    flex: 1,
  },
  emergencyType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  emergencyTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  emergencyBadges: {
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  serviceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  serviceStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
}); 