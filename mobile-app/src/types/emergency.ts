// Shared TypeScript interfaces matching FastAPI backend models and web frontend

export type EmergencyStatus = 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type EmergencyType = 'FIRE' | 'MEDICAL' | 'CRIME' | 'NATURAL_DISASTER' | 'TRAFFIC' | 'OTHER';
export type ServiceType = 'MEDICAL' | 'FIRE' | 'POLICE' | 'NGO';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Emergency {
  id: string;
  emergency_type: EmergencyType;
  priority_level: PriorityLevel;
  status: EmergencyStatus;
  location_lat?: number;
  location_lon?: number;
  response_plan?: Record<string, any>;
  estimated_response_time?: string;
  actual_response_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyResponse {
  emergency_type: EmergencyType;
  priority_level: PriorityLevel;
  response_plan: Record<string, any>;
  estimated_response_time?: number;
}

export interface EmergencyRequest {
  text?: string;
  location?: Location;
  audio?: string; // File URI on mobile
}

export interface ServiceAvailability {
  id: string;
  service_type: ServiceType;
  status: 'active' | 'limited' | 'inactive';
  available_units: number;
  average_response_time: number;
  updated_at: string;
}

export interface EmergencyStats {
  total_emergencies: number;
  average_response_time: number;
  response_by_type: Record<EmergencyType, number>;
  success_rate: number;
}

// Mobile-specific types
export interface AudioRecording {
  uri: string;
  duration: number;
  size: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  is_primary: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  medical_info?: string;
  emergency_contacts: EmergencyContact[];
  notification_preferences: {
    push_notifications: boolean;
    sms_notifications: boolean;
    emergency_alerts: boolean;
  };
} 