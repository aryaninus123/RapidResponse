// Shared TypeScript interfaces matching FastAPI backend models

export type EmergencyStatus = 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type EmergencyType = 'FIRE' | 'MEDICAL' | 'CRIME' | 'NATURAL_DISASTER' | 'TRAFFIC' | 'OTHER';
export type ServiceType = 'MEDICAL' | 'FIRE' | 'POLICE' | 'NGO';

export interface Location {
  lat: number;
  lon: number;
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

export interface NotificationSubscription {
  subscriber_type: string;
  subscriber_id: string;
  notification_type: string;
  channel: string;
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

// WebSocket message types
export interface WebSocketMessage {
  type: 'emergency_update' | 'new_emergency' | 'status_change' | 'service_update';
  data: any;
  timestamp: string;
}

// Audio recording types
export interface AudioRecording {
  blob: Blob;
  duration: number;
  url: string;
}

// Form data types
export interface EmergencyReportForm {
  text?: string;
  audio?: File;
  lat?: number;
  lon?: number;
  emergency_type?: EmergencyType;
} 