import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Location as LocationType } from '../types/emergency';

interface LocationPickerProps {
  location: LocationType | null;
  onLocationSelect: (location: LocationType) => void;
  hasPermission: boolean;
}

export function LocationPicker({ 
  location, 
  onLocationSelect, 
  hasPermission 
}: LocationPickerProps) {
  const [manualMode, setManualMode] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please enable location access in settings to use this feature.'
      );
      return;
    }

    setIsGettingLocation(true);

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      onLocationSelect({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Could not get your current location. Please try again or enter coordinates manually.'
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert(
        'Invalid Coordinates',
        'Please enter valid latitude and longitude values.'
      );
      return;
    }

    if (lat < -90 || lat > 90) {
      Alert.alert(
        'Invalid Latitude',
        'Latitude must be between -90 and 90 degrees.'
      );
      return;
    }

    if (lon < -180 || lon > 180) {
      Alert.alert(
        'Invalid Longitude',
        'Longitude must be between -180 and 180 degrees.'
      );
      return;
    }

    onLocationSelect({ latitude: lat, longitude: lon });
    setManualMode(false);
    setManualLat('');
    setManualLon('');
  };

  return (
    <View style={styles.container}>
      {location && (
        <View style={styles.currentLocation}>
          <MaterialIcons name="location-on" size={20} color="#16a34a" />
          <Text style={styles.locationText}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {!manualMode ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={getCurrentLocation}
            disabled={!hasPermission || isGettingLocation}
          >
            <MaterialIcons 
              name={isGettingLocation ? "hourglass-empty" : "my-location"} 
              size={20} 
              color="white" 
            />
            <Text style={styles.buttonText}>
              {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setManualMode(true)}
          >
            <MaterialIcons name="edit-location" size={20} color="#374151" />
            <Text style={styles.secondaryButtonText}>
              Enter Manually
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.manualInput}>
          <Text style={styles.manualTitle}>Enter Coordinates</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Latitude</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 37.7749"
                value={manualLat}
                onChangeText={setManualLat}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Longitude</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., -122.4194"
                value={manualLon}
                onChangeText={setManualLon}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
          </View>

          <View style={styles.manualButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setManualMode(false);
                setManualLat('');
                setManualLon('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleManualLocationSubmit}
            >
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!hasPermission && (
        <View style={styles.permissionWarning}>
          <MaterialIcons name="warning" size={16} color="#f59e0b" />
          <Text style={styles.warningText}>
            Location permission required for automatic detection
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#374151',
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  manualInput: {
    gap: 12,
  },
  manualTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  manualButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#16a34a',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    gap: 6,
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
  },
}); 