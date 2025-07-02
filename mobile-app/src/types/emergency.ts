// Shared TypeScript interfaces matching FastAPI backend models and web frontend

export type EmergencyStatus = 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type EmergencyType = 
  | 'FIRE'
  | 'MEDICAL' 
  | 'CRIME'
  | 'NATURAL_DISASTER'
  | 'TRAFFIC'
  | 'OTHER';
export type ServiceType = 'MEDICAL' | 'FIRE' | 'POLICE' | 'NGO';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  temperature?: number;
  conditions: string;
  wind_speed?: number;
  visibility?: number;
  precipitation?: number;
  timestamp: string;
}

export interface TrafficData {
  congestion_level: string;
  incidents: any[];
  average_speed?: number;
  timestamp: string;
}

export interface Hospital {
  name: string;
  address: string;
  phone?: string;
  rating?: number;
  distance?: number;
  emergency: boolean;
}

export interface ContextData {
  weather?: WeatherData;
  traffic?: TrafficData;
  hospitals?: Hospital[];
  fire_stations?: any[];
  police_stations?: any[];
}

export interface Emergency {
  id: string;
  emergency_type: EmergencyType;
  description: string;
  location_lat: number;
  location_lon: number;
  priority_level: PriorityLevel;
  status: EmergencyStatus;
  response_plan?: Record<string, any>;
  estimated_response_time?: string;
  actual_response_time?: string;
  notes?: string;
  context_data?: ContextData;
  created_at: string;
  updated_at: string;
  audio_file_url?: string;
  additional_info?: string;
}

export interface EmergencyResponse {
  emergency_id: string;
  emergency_type: EmergencyType;
  priority_level: PriorityLevel;
  estimated_response_time: number;
  response_plan: Record<string, unknown>;
  status: string;
  assigned_units?: string[];
  contact_number?: string;
}

export interface EmergencyRequest {
  text?: string;
  location?: Location;
  audio?: string; // File URI on mobile
}

export interface ServiceAvailability {
  id: string;
  service_type: string;
  status: 'active' | 'limited' | 'unavailable';
  available_units: number;
  average_response_time: number;
  location: Location;
}

export interface EmergencyStats {
  total_emergencies: number;
  average_response_time: number;
  success_rate: number;
  emergencies_by_type: Record<EmergencyType, number>;
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

export interface EmergencyReport {
  emergency_type: EmergencyType;
  description: string;
  location: Location;
  audio_recording?: AudioRecording;
  additional_info?: string;
}

export interface WebSocketMessage {
  type: 'emergency_update' | 'service_status' | 'alert' | 'system_status';
  data: unknown;
  timestamp: string;
  client_id?: string;
} 