import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { EmergencyResponse } from '../types/emergency';

interface EmergencyDetailsScreenProps {
  route: {
    params: {
      emergencyResponse?: EmergencyResponse;
      isNewReport?: boolean;
    };
  };
  navigation: any;
}

export function EmergencyDetailsScreen({ route, navigation }: EmergencyDetailsScreenProps) {
  const { emergencyResponse, isNewReport } = route.params;

  if (!emergencyResponse) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={48} color="#dc2626" />
        <Text style={styles.errorText}>Emergency details not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {isNewReport && (
        <View style={styles.successBanner}>
          <MaterialIcons name="check-circle" size={24} color="#16a34a" />
          <Text style={styles.successText}>Emergency reported successfully!</Text>
        </View>
      )}

      <View style={styles.headerCard}>
        <View style={styles.emergencyTypeContainer}>
          <Text style={styles.emergencyIcon}>
            {getEmergencyIcon(emergencyResponse.emergency_type)}
          </Text>
          <View style={styles.typeInfo}>
            <Text style={styles.emergencyType}>
              {emergencyResponse.emergency_type.replace('_', ' ')} Emergency
            </Text>
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(emergencyResponse.priority_level) }
            ]}>
              <Text style={styles.priorityText}>
                {emergencyResponse.priority_level} PRIORITY
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Response Information</Text>
        
        {emergencyResponse.estimated_response_time && (
          <View style={styles.detailRow}>
            <MaterialIcons name="schedule" size={20} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Estimated Response Time</Text>
              <Text style={styles.detailValue}>
                {emergencyResponse.estimated_response_time} minutes
              </Text>
            </View>
          </View>
        )}

        {emergencyResponse.response_plan && (
          <View style={styles.detailRow}>
            <MaterialIcons name="assignment" size={20} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Response Plan</Text>
              <View style={styles.responsePlan}>
                {Object.entries(emergencyResponse.response_plan).map(([key, value]) => (
                  <Text key={key} style={styles.planItem}>
                    • {key}: {String(value)}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>What happens next?</Text>
        
        <View style={styles.statusStep}>
          <View style={styles.stepIcon}>
            <MaterialIcons name="radio" size={20} color="#16a34a" />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Emergency services notified</Text>
            <Text style={styles.stepDescription}>
              Your emergency has been received and appropriate services have been dispatched.
            </Text>
          </View>
        </View>

        <View style={styles.statusStep}>
          <View style={styles.stepIcon}>
            <MaterialIcons name="directions" size={20} color="#3b82f6" />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Responders en route</Text>
            <Text style={styles.stepDescription}>
              Emergency responders are on their way to your location.
            </Text>
          </View>
        </View>

        <View style={styles.statusStep}>
          <View style={styles.stepIcon}>
            <MaterialIcons name="local-hospital" size={20} color="#f59e0b" />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Help will arrive soon</Text>
            <Text style={styles.stepDescription}>
              Stay calm and follow any instructions from emergency personnel.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsCard}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <MaterialIcons name="dashboard" size={20} color="#3b82f6" />
          <Text style={styles.actionButtonText}>View Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => navigation.navigate('Report')}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={[styles.actionButtonText, styles.primaryActionText]}>
            Report Another Emergency
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.importantNotice}>
        <MaterialIcons name="info" size={20} color="#f59e0b" />
        <Text style={styles.noticeText}>
          For immediate life-threatening emergencies, always call your local emergency number (911, 112, etc.) directly.
        </Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  successText: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  emergencyTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  typeInfo: {
    flex: 1,
  },
  emergencyType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
  },
  responsePlan: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  planItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  statusStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  primaryAction: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  primaryActionText: {
    color: 'white',
  },
  importantNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fefbf3',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  noticeText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
}); 