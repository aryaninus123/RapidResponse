import { 
  Emergency, 
  EmergencyResponse, 
  EmergencyStats, 
  ServiceAvailability,
  NotificationSubscription,
  EmergencyStatus
} from '@/types/emergency';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    } as Record<string, string>,
    ...options,
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData && config.headers) {
    delete (config.headers as Record<string, string>)['Content-Type'];
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, response.statusText, errorText);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return response as unknown as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const emergencyAPI = {
  // Report new emergency
  report: async (formData: FormData): Promise<EmergencyResponse> => {
    return apiRequest('/emergency/report', {
      method: 'POST',
      body: formData,
    });
  },

  // Get emergency by ID
  getById: async (id: string): Promise<Emergency> => {
    return apiRequest(`/emergency/${id}`);
  },

  // Update emergency status
  update: async (id: string, data: { status: EmergencyStatus; notes?: string }): Promise<Emergency> => {
    return apiRequest(`/emergency/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Get emergency history
  getHistory: async (params?: {
    start_date?: string;
    end_date?: string;
    emergency_type?: string;
    status?: EmergencyStatus;
    limit?: number;
    offset?: number;
  }): Promise<Emergency[]> => {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    return apiRequest(`/emergency/history${queryString ? `?${queryString}` : ''}`);
  },

  // Get emergency statistics
  getStats: async (timePeriod: string = '24h'): Promise<EmergencyStats> => {
    return apiRequest(`/emergency/stats?time_period=${timePeriod}`);
  },
};

export const serviceAPI = {
  // Get service availability
  getAvailability: async (): Promise<ServiceAvailability[]> => {
    return apiRequest('/services/availability');
  },

  // Update service status
  updateStatus: async (serviceId: string, data: Partial<ServiceAvailability>): Promise<ServiceAvailability> => {
    return apiRequest(`/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

export const notificationAPI = {
  // Subscribe to notifications
  subscribe: async (subscription: NotificationSubscription): Promise<{ success: boolean }> => {
    return apiRequest('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
  },

  // Get notifications for subscriber
  getNotifications: async (subscriberId: string): Promise<any[]> => {
    return apiRequest(`/notifications/${subscriberId}`);
  },
};

export const systemAPI = {
  // Health check
  health: async (): Promise<{ status: string; message: string }> => {
    return apiRequest('/health');
  },
};

// Export convenience function for file uploads
export const uploadEmergencyReport = async (
  audioFile?: File,
  text?: string,
  lat?: number,
  lon?: number
): Promise<EmergencyResponse> => {
  const formData = new FormData();
  
  if (audioFile) {
    formData.append('audio', audioFile);
  }
  
  if (text) {
    formData.append('text', text);
  }
  
  if (lat !== undefined) {
    formData.append('lat', lat.toString());
  }
  
  if (lon !== undefined) {
    formData.append('lon', lon.toString());
  }
  
  return emergencyAPI.report(formData);
};

export { ApiError }; 