import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Vibration,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { apiService } from '../services/api';
import { AudioRecorder } from './AudioRecorder';
import { LocationPicker } from './LocationPicker';
import { EmergencyTypeSelector } from './EmergencyTypeSelector';
import { 
  Location as LocationType, 
  EmergencyType, 
  EmergencyResponse,
  AudioRecording 
} from '../types/emergency';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

interface EmergencyReportScreenProps {
  navigation: any;
}

export function EmergencyReportScreen({ navigation }: EmergencyReportScreenProps) {
  const [inputMethod, setInputMethod] = useState<'text' | 'audio'>('text');
  const [text, setText] = useState('');
  const [selectedType, setSelectedType] = useState<EmergencyType | undefined>();
  const [location, setLocation] = useState<LocationType | null>(null);
  const [audioRecording, setAudioRecording] = useState<AudioRecording | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [audioPermission, setAudioPermission] = useState(false);

  useEffect(() => {
    requestPermissions();
    getCurrentLocation();
  }, []);

  const requestPermissions = async () => {
    // Location permission
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(locationStatus === 'granted');

    // Audio permission
    const { status: audioStatus } = await Audio.requestPermissionsAsync();
    setAudioPermission(audioStatus === 'granted');

    if (locationStatus !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Please enable location access for accurate emergency reporting.',
        [{ text: 'OK' }]
      );
    }

    if (audioStatus !== 'granted') {
      Alert.alert(
        'Microphone Permission Required',
        'Please enable microphone access for voice emergency reports.',
        [{ text: 'OK' }]
      );
    }
  };

  const getCurrentLocation = async () => {
    if (!locationPermission) return;

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        maximumAge: 10000,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: 'Could not get your current location',
      });
    }
  };

  const handleAudioRecording = (recording: AudioRecording) => {
    setAudioRecording(recording);
    Toast.show({
      type: 'success',
      text1: 'Audio Recorded',
      text2: 'Voice recording captured successfully',
    });
  };

  const handleLocationSelect = (selectedLocation: LocationType) => {
    setLocation(selectedLocation);
  };

  const validateForm = (): boolean => {
    if (!text && !audioRecording) {
      Toast.show({
        type: 'error',
        text1: 'Input Required',
        text2: 'Please provide either text description or voice recording',
      });
      return false;
    }

    if (!location) {
      Toast.show({
        type: 'error',
        text1: 'Location Required',
        text2: 'Please provide your location for emergency response',
      });
      return false;
    }

    return true;
  };

  const submitEmergency = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    Vibration.vibrate([0, 100, 200, 100]); // Emergency haptic feedback

    try {
      const response = await apiService.reportEmergency(
        audioRecording?.uri,
        text || undefined,
        location!
      );

      Toast.show({
        type: 'success',
        text1: 'Emergency Reported!',
        text2: 'Help is on the way. Stay safe.',
      });

      // Navigate to emergency details or dashboard
      navigation.navigate('EmergencyDetails', { 
        emergencyResponse: response,
        isNewReport: true 
      });

      // Reset form
      setText('');
      setAudioRecording(null);
      setSelectedType(undefined);

    } catch (error) {
      console.error('Emergency submission error:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Please try again or call emergency services',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickEmergencyCall = () => {
    Alert.alert(
      'Call Emergency Services',
      'This will call your local emergency number (911, 112, etc.)',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => {
          // In a real app, you'd use Linking.openURL('tel:911')
          Toast.show({
            type: 'info',
            text1: 'Emergency Call',
            text2: 'In production, this would dial emergency services',
          });
        }}
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Emergency Header */}
      <View style={styles.header}>
        <MaterialIcons name="emergency" size={32} color="#ef4444" />
        <Text style={styles.headerTitle}>Report Emergency</Text>
        <Text style={styles.headerSubtitle}>
          Provide details about the emergency situation
        </Text>
      </View>

      {/* Quick Emergency Call Button */}
      <TouchableOpacity style={styles.emergencyCallButton} onPress={quickEmergencyCall}>
        <MaterialIcons name="phone" size={24} color="white" />
        <Text style={styles.emergencyCallText}>Emergency Call</Text>
      </TouchableOpacity>

      {/* Input Method Selection */}
      <View style={styles.inputMethodContainer}>
        <TouchableOpacity
          style={[
            styles.inputMethodButton,
            inputMethod === 'text' && styles.inputMethodButtonActive
          ]}
          onPress={() => setInputMethod('text')}
        >
          <MaterialIcons 
            name="keyboard" 
            size={20} 
            color={inputMethod === 'text' ? '#ef4444' : '#6b7280'} 
          />
          <Text style={[
            styles.inputMethodText,
            inputMethod === 'text' && styles.inputMethodTextActive
          ]}>
            Text Description
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.inputMethodButton,
            inputMethod === 'audio' && styles.inputMethodButtonActive
          ]}
          onPress={() => setInputMethod('audio')}
          disabled={!audioPermission}
        >
          <MaterialIcons 
            name="mic" 
            size={20} 
            color={inputMethod === 'audio' ? '#ef4444' : '#6b7280'} 
          />
          <Text style={[
            styles.inputMethodText,
            inputMethod === 'audio' && styles.inputMethodTextActive,
            !audioPermission && styles.disabledText
          ]}>
            Voice Recording
          </Text>
        </TouchableOpacity>
      </View>

      {/* Text Input */}
      {inputMethod === 'text' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Description *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Describe the emergency situation in detail..."
            multiline
            numberOfLines={4}
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Audio Recording */}
      {inputMethod === 'audio' && audioPermission && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Recording *</Text>
          <AudioRecorder onRecordingComplete={handleAudioRecording} />
        </View>
      )}

      {/* Emergency Type Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Type (Optional)</Text>
        <EmergencyTypeSelector
          selectedType={selectedType}
          onTypeSelect={setSelectedType}
        />
      </View>

      {/* Location Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Location *</Text>
        <LocationPicker
          location={location}
          onLocationSelect={handleLocationSelect}
          hasPermission={locationPermission}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!text && !audioRecording) && styles.submitButtonDisabled
        ]}
        onPress={submitEmergency}
        disabled={isSubmitting || (!text && !audioRecording)}
      >
        {isSubmitting ? (
          <View style={styles.loadingContainer}>
            <MaterialIcons name="hourglass-empty" size={20} color="white" />
            <Text style={styles.submitButtonText}>Submitting...</Text>
          </View>
        ) : (
          <>
            <MaterialIcons name="send" size={20} color="white" />
            <Text style={styles.submitButtonText}>Submit Emergency Report</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          📍 Your location helps emergency responders find you quickly
        </Text>
        <Text style={styles.instructionText}>
          🎙️ Voice recordings can provide critical details
        </Text>
        <Text style={styles.instructionText}>
          🚨 For immediate life-threatening emergencies, call 911 directly
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 5,
  },
  emergencyCallButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emergencyCallText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inputMethodContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  inputMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  inputMethodButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  inputMethodText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  inputMethodTextActive: {
    color: '#ef4444',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructions: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  instructionText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 4,
  },
  disabledText: {
    color: '#9ca3af',
  },
}); 