import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { AudioRecording as AudioRecordingType } from '../types/emergency';

interface AudioRecorderProps {
  onRecordingComplete: (recording: AudioRecordingType) => void;
  maxDuration?: number;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onRecordingComplete, 
  maxDuration = 300 
}: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      // Request permission
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant microphone permission to record audio.'
        );
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const pauseRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.pauseAsync();
        setIsPaused(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      } catch (error) {
        console.error('Failed to pause recording:', error);
      }
    }
  };

  const resumeRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.startAsync();
        setIsPaused(false);
        
        // Resume timer
        timerRef.current = setInterval(() => {
          setDuration((prev) => {
            const newDuration = prev + 1;
            if (newDuration >= maxDuration) {
              stopRecording();
              return maxDuration;
            }
            return newDuration;
          });
        }, 1000);
      } catch (error) {
        console.error('Failed to resume recording:', error);
      }
    }
  };

  const stopRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        
        if (uri) {
          setRecordingUri(uri);
          
          // Get file info
          const { sound, status } = await recordingRef.current.createNewLoadedSoundAsync();
          
          const recordingData: AudioRecordingType = {
            uri,
            duration,
            size: 0, // We'll calculate this if needed
          };
          
          onRecordingComplete(recordingData);
          
          // Clean up sound
          await sound.unloadAsync();
        }
        
        recordingRef.current = null;
        setIsRecording(false);
        setIsPaused(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
      } catch (error) {
        console.error('Failed to stop recording:', error);
        Alert.alert('Recording Error', 'Failed to stop recording.');
      }
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        {!isRecording ? (
          <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
            <MaterialIcons name="mic" size={32} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={styles.recordingControls}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={isPaused ? resumeRecording : pauseRecording}
            >
              <MaterialIcons 
                name={isPaused ? "play-arrow" : "pause"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
              <MaterialIcons name="stop" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.durationText}>
          {formatDuration(duration)}
        </Text>
        
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              {isPaused ? 'Paused' : 'Recording'}
            </Text>
          </View>
        )}
        
        {recordingUri && !isRecording && (
          <Text style={styles.completedText}>
            ✓ Recording completed
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  controls: {
    marginBottom: 15,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordingControls: {
    flexDirection: 'row',
    gap: 15,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  stopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  info: {
    alignItems: 'center',
  },
  durationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  recordingText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  completedText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
}); 