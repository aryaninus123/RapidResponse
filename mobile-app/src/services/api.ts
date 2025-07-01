import axios, { AxiosResponse } from 'axios';
import { 
  Emergency, 
  EmergencyResponse, 
  EmergencyStats, 
  ServiceAvailability,
  EmergencyStatus,
  Location
} from '../types/emergency';

// Use your deployed backend URL or localhost for development
const API_BASE = __DEV__ 
  ? 'http://10.0.2.2:8000'  // Android emulator localhost
  : 'https://your-rapidresponse-api.com';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE;
  }

  // Configure axios instance
  private get api() {
    return axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds for emergency requests
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Emergency reporting
  async reportEmergency(
    audioUri?: string,
    text?: string,
    location?: Location
  ): Promise<EmergencyResponse> {
    const formData = new FormData();

    if (audioUri) {
      // Create file object from URI for React Native
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'emergency-audio.wav',
      } as any);
    }

    if (text) {
      formData.append('text', text);
    }

    if (location) {
      formData.append('lat', location.latitude.toString());
      formData.append('lon', location.longitude.toString());
    }

    const response = await axios.post(`${this.baseURL}/emergency/report`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for file upload
    });

    return response.data;
  }

  // Get emergency by ID
  async getEmergency(id: string): Promise<Emergency> {
    const response = await this.api.get(`/emergency/${id}`);
    return response.data;
  }

  // Update emergency status
  async updateEmergency(
    id: string, 
    status: EmergencyStatus, 
    notes?: string
  ): Promise<Emergency> {
    const response = await this.api.put(`/emergency/${id}`, {
      status,
      notes,
    });
    return response.data;
  }

  // Get emergency history
  async getEmergencyHistory(params?: {
    start_date?: string;
    end_date?: string;
    emergency_type?: string;
    status?: EmergencyStatus;
    limit?: number;
    offset?: number;
  }): Promise<Emergency[]> {
    const response = await this.api.get('/emergency/history', { params });
    return response.data;
  }

  // Get emergency statistics
  async getEmergencyStats(timePeriod: string = '24h'): Promise<EmergencyStats> {
    const response = await this.api.get('/emergency/stats', {
      params: { time_period: timePeriod },
    });
    return response.data;
  }

  // Get service availability
  async getServiceAvailability(): Promise<ServiceAvailability[]> {
    const response = await this.api.get('/services/availability');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('API connection failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService; 