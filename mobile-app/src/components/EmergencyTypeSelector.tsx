import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { EmergencyType } from '../types/emergency';

interface EmergencyTypeSelectorProps {
  selectedType?: EmergencyType;
  onTypeSelect: (type: EmergencyType) => void;
}

interface EmergencyTypeOption {
  type: EmergencyType;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const emergencyTypes: EmergencyTypeOption[] = [
  {
    type: 'FIRE',
    label: 'Fire Emergency',
    icon: '🔥',
    color: '#dc2626',
    description: 'Fire, explosion, or smoke',
  },
  {
    type: 'MEDICAL',
    label: 'Medical Emergency',
    icon: '🚑',
    color: '#0ea5e9',
    description: 'Injury, illness, or medical crisis',
  },
  {
    type: 'CRIME',
    label: 'Crime/Security',
    icon: '🚨',
    color: '#7c3aed',
    description: 'Theft, assault, or security threat',
  },
  {
    type: 'NATURAL_DISASTER',
    label: 'Natural Disaster',
    icon: '⛈️',
    color: '#f59e0b',
    description: 'Earthquake, flood, or severe weather',
  },
  {
    type: 'TRAFFIC',
    label: 'Traffic Accident',
    icon: '🚗',
    color: '#16a34a',
    description: 'Vehicle accident or road hazard',
  },
  {
    type: 'OTHER',
    label: 'Other Emergency',
    icon: '⚠️',
    color: '#6b7280',
    description: 'Other emergency situation',
  },
];

export function EmergencyTypeSelector({ 
  selectedType, 
  onTypeSelect 
}: EmergencyTypeSelectorProps) {
  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.grid}>
        {emergencyTypes.map((emergencyType) => {
          const isSelected = selectedType === emergencyType.type;
          
          return (
            <TouchableOpacity
              key={emergencyType.type}
              style={[
                styles.typeCard,
                isSelected && { 
                  borderColor: emergencyType.color,
                  backgroundColor: `${emergencyType.color}10`,
                },
              ]}
              onPress={() => onTypeSelect(emergencyType.type)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{emergencyType.icon}</Text>
                {isSelected && (
                  <View style={[styles.selectedIndicator, { backgroundColor: emergencyType.color }]}>
                    <MaterialIcons name="check" size={12} color="white" />
                  </View>
                )}
              </View>
              
              <Text style={[
                styles.typeLabel,
                isSelected && { color: emergencyType.color }
              ]}>
                {emergencyType.label}
              </Text>
              
              <Text style={styles.typeDescription}>
                {emergencyType.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <View style={styles.hint}>
        <MaterialIcons name="info" size={16} color="#6b7280" />
        <Text style={styles.hintText}>
          Selecting emergency type helps route your report to the right responders
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  typeCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    minHeight: 100,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  icon: {
    fontSize: 28,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 14,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    marginTop: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
    lineHeight: 16,
  },
}); 