'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, AlertTriangle, Phone, MessageSquare } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { LocationPicker } from './LocationPicker';
import { uploadEmergencyReport } from '@/lib/api';
import { EmergencyType, Location, AudioRecording, EmergencyResponse } from '@/types/emergency';
import toast from 'react-hot-toast';

const emergencySchema = z.object({
  text: z.string().optional(),
  emergency_type: z.enum(['FIRE', 'MEDICAL', 'CRIME', 'NATURAL_DISASTER', 'TRAFFIC', 'OTHER']).optional(),
  location: z.object({
    lat: z.number(),
    lon: z.number(),
  }).optional(),
});

type EmergencyFormData = z.infer<typeof emergencySchema>;

interface EmergencyReportFormProps {
  onSubmissionSuccess?: (response: EmergencyResponse) => void;
  onSubmissionError?: (error: Error) => void;
}

export function EmergencyReportForm({
  onSubmissionSuccess,
  onSubmissionError,
}: EmergencyReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioRecording, setAudioRecording] = useState<AudioRecording | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [inputMethod, setInputMethod] = useState<'text' | 'audio'>('text');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<EmergencyFormData>({
    resolver: zodResolver(emergencySchema),
  });

  const textInput = watch('text');
  const selectedType = watch('emergency_type');

  // Get user's current location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setCurrentLocation(location);
          setValue('location', location);
        },
        (error) => {
          console.warn('Could not get location:', error);
          toast.error('Could not get your location. Please select manually on the map.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    }
  }, [setValue]);

  const handleAudioRecording = (recording: AudioRecording) => {
    setAudioRecording(recording);
    toast.success('Audio recorded successfully!');
  };

  const handleLocationSelect = (location: Location) => {
    setCurrentLocation(location);
    setValue('location', location);
  };

  const onSubmit = async (data: EmergencyFormData) => {
    if (!data.text && !audioRecording) {
      toast.error('Please provide either text description or audio recording');
      return;
    }

    if (!data.location) {
      toast.error('Please provide your location for emergency response');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create audio file from recording
      let audioFile: File | undefined;
      if (audioRecording) {
        audioFile = new File([audioRecording.blob], 'emergency-audio.webm', {
          type: 'audio/webm;codecs=opus',
        });
      }

      const response = await uploadEmergencyReport(
        audioFile,
        data.text,
        data.location.lat,
        data.location.lon
      );

      toast.success('Emergency report submitted successfully!');
      onSubmissionSuccess?.(response);
      
      // Reset form
      reset();
      setAudioRecording(null);
      setInputMethod('text');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit emergency report';
      toast.error(errorMessage);
      onSubmissionError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  const emergencyTypes: { value: EmergencyType; label: string; color: string; icon: string }[] = [
    { value: 'FIRE', label: 'Fire Emergency', color: 'bg-fire-500', icon: '🔥' },
    { value: 'MEDICAL', label: 'Medical Emergency', color: 'bg-medical-500', icon: '🚑' },
    { value: 'CRIME', label: 'Crime/Security', color: 'bg-red-500', icon: '🚨' },
    { value: 'NATURAL_DISASTER', label: 'Natural Disaster', color: 'bg-yellow-500', icon: '⛈️' },
    { value: 'TRAFFIC', label: 'Traffic Accident', color: 'bg-orange-500', icon: '🚗' },
    { value: 'OTHER', label: 'Other Emergency', color: 'bg-gray-500', icon: '⚠️' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <AlertTriangle className="mr-2 text-emergency-500" />
          Report Emergency
        </h2>
        <p className="text-gray-600">
          Provide details about the emergency. You can type a description or record an audio message.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Input Method Selection */}
        <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setInputMethod('text')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              inputMethod === 'text'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="inline mr-2" size={16} />
            Text Description
          </button>
          <button
            type="button"
            onClick={() => setInputMethod('audio')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              inputMethod === 'audio'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Phone className="inline mr-2" size={16} />
            Voice Recording
          </button>
        </div>

        {/* Text Input */}
        {inputMethod === 'text' && (
          <div>
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Description *
            </label>
            <textarea
              {...register('text')}
              id="text"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emergency-500 focus:border-transparent"
              placeholder="Describe the emergency situation in detail..."
            />
            {errors.text && (
              <p className="mt-1 text-sm text-red-600">{errors.text.message}</p>
            )}
          </div>
        )}

        {/* Audio Input */}
        {inputMethod === 'audio' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voice Recording *
            </label>
            <AudioRecorder onRecordingComplete={handleAudioRecording} />
          </div>
        )}

        {/* Emergency Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emergency Type (Optional)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {emergencyTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setValue('emergency_type', type.value)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedType === type.value
                    ? 'border-emergency-500 bg-emergency-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Location Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline mr-1" size={16} />
            Emergency Location *
          </label>
          <LocationPicker
            initialLocation={currentLocation}
            onLocationSelect={handleLocationSelect}
          />
          {currentLocation && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {currentLocation.lat.toFixed(6)}, {currentLocation.lon.toFixed(6)}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || (!textInput && !audioRecording)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isSubmitting || (!textInput && !audioRecording)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-emergency-500 text-white hover:bg-emergency-600'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </span>
            ) : (
              'Submit Emergency Report'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 