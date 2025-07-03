'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Phone,
  Users,
  Activity,
  RefreshCw,
  Cloud,
  Car,
  CheckCircle,
  X
} from 'lucide-react';
import { Emergency, EmergencyStats, ServiceAvailability } from '@/types/emergency';
import { emergencyAPI, serviceAPI } from '@/lib/api';
import { EmergencyMap } from './EmergencyMap';
import { EmergencyAnalytics } from './EmergencyAnalytics';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { WebSocketMessage } from '@/types/emergency';

interface EmergencyDashboardProps {
  lastMessage?: WebSocketMessage | null;
}

export function EmergencyDashboard({ lastMessage }: EmergencyDashboardProps) {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [stats, setStats] = useState<EmergencyStats | null>(null);
  const [services, setServices] = useState<ServiceAvailability[] | Record<string, any>>([]);
  const [conditions, setConditions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'new_emergency':
          loadEmergencies();
          loadStats();
          break;
        case 'emergency_update':
          loadEmergencies();
          break;
        case 'service_update':
          loadServices();
          break;
      }
    }
  }, [lastMessage]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadEmergencies(),
        loadStats(),
        loadServices(),
        loadConditions()
      ]);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadEmergencies = async () => {
    try {
      const data = await emergencyAPI.getHistory({ limit: 20 });
      setEmergencies(data);
    } catch (error) {
      console.error('Failed to load emergencies:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await emergencyAPI.getStats('24h');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadServices = async () => {
    try {
      const data = await serviceAPI.getAvailability();
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const loadConditions = async () => {
    try {
      const response = await fetch('http://localhost:8000/conditions/current');
      if (response.ok) {
        const data = await response.json();
        setConditions(data);
      }
    } catch (error) {
      console.error('Failed to load conditions:', error);
    }
  };

  const closeEmergency = async (emergencyId: string, notes?: string) => {
    try {
      const notesParam = encodeURIComponent(notes || 'Emergency resolved by dashboard action');
      const response = await fetch(`http://localhost:8000/emergency/${emergencyId}/close?notes=${notesParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to close emergency');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Emergency closed successfully');
        
        // Refresh all dashboard data
        await Promise.all([
          loadEmergencies(),
          loadStats(),
          loadServices()
        ]);
      } else {
        throw new Error(result.message || 'Failed to close emergency');
      }
    } catch (error) {
      console.error('Failed to close emergency:', error);
      toast.error('Failed to close emergency');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-red-100 text-red-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'FIRE': return '🔥';
      case 'MEDICAL': return '🚑';
      case 'CRIME': return '🚨';
      case 'NATURAL_DISASTER': return '⛈️';
      case 'TRAFFIC': return '🚗';
      default: return '⚠️';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emergency-500"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Emergencies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_emergencies}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Emergencies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {emergencies.filter(e => e.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.average_response_time.toFixed(1)}m</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Resolved Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {emergencies.filter(e => e.status === 'RESOLVED').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Array.isArray(services) ? services.length : Object.keys(services || {}).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Current Conditions Widget */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Current Conditions</h3>
              <button
                onClick={loadConditions}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <RefreshCw size={16} className="mr-1" />
                Refresh
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Weather Widget */}
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Cloud className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Weather</p>
                <p className="text-xs text-gray-600">
                  {conditions?.weather ? 
                    `${conditions.weather.conditions}, ${conditions.weather.temperature}°C` :
                    'Loading weather...'
                  }
                </p>
                {conditions?.weather?.wind_speed && (
                  <p className="text-xs text-gray-500">Wind: {conditions.weather.wind_speed} km/h</p>
                )}
              </div>
            </div>
            
            {/* Traffic Widget */}
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <Car className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Traffic</p>
                <p className="text-xs text-gray-600">
                  {conditions?.traffic ? 
                    `${conditions.traffic.congestion_level.charAt(0).toUpperCase() + conditions.traffic.congestion_level.slice(1)} congestion` :
                    'Loading traffic...'
                  }
                </p>
                {conditions?.traffic?.average_speed && (
                  <p className="text-xs text-gray-500">Avg speed: {conditions.traffic.average_speed} km/h</p>
                )}
              </div>
            </div>
            
            {/* Last Updated */}
            {conditions?.last_updated && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Updated: {new Date(conditions.last_updated).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Emergencies */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Emergencies</h3>
              <div className="flex items-center space-x-2">
                {emergencies.filter(e => e.status === 'ACTIVE').length > 0 && (
                  <button
                    onClick={() => {
                      const activeEmergencies = emergencies.filter(e => e.status === 'ACTIVE');
                      if (window.confirm(`Are you sure you want to close all ${activeEmergencies.length} active emergencies?`)) {
                        Promise.all(activeEmergencies.map(e => closeEmergency(e.id, 'Bulk closure from dashboard')));
                      }
                    }}
                    className="text-sm text-green-600 hover:text-green-800 flex items-center"
                  >
                    <CheckCircle size={16} className="mr-1" />
                    Close All Active
                  </button>
                )}
                <button
                  onClick={loadEmergencies}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <RefreshCw size={16} className="mr-1" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {emergencies
              .sort((a, b) => {
                // First sort by status: ACTIVE emergencies first
                if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
                if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
                
                // Then sort by creation time (newest first)
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              })
              .slice(0, 10)
              .map((emergency) => (
              <div
                key={emergency.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center space-x-3 flex-1 cursor-pointer"
                    onClick={() => setSelectedEmergency(emergency)}
                  >
                    <span className="text-2xl">{getEmergencyIcon(emergency.emergency_type)}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {emergency.emergency_type.replace('_', ' ')}
                        </p>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(emergency.priority_level)}`}>
                          {emergency.priority_level}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(emergency.status)}`}>
                          {emergency.status}
                        </span>
                      </div>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Clock size={14} className="mr-1" />
                        {format(new Date(emergency.created_at), 'MMM dd, HH:mm')}
                        {emergency.location_lat && emergency.location_lon && (
                          <>
                            <MapPin size={14} className="ml-2 mr-1" />
                            {emergency.location_lat.toFixed(4)}, {emergency.location_lon.toFixed(4)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">ID: {emergency.id.slice(0, 8)}</p>
                    </div>
                    
                    {/* Close Emergency Button */}
                    {emergency.status === 'ACTIVE' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to close this emergency?')) {
                            closeEmergency(emergency.id);
                          }
                        }}
                        className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                        title="Close Emergency"
                      >
                        <CheckCircle size={14} />
                        <span>Close</span>
                      </button>
                    )}
                    
                    {emergency.status === 'RESOLVED' && (
                      <div className="ml-2 px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg flex items-center space-x-1">
                        <CheckCircle size={14} />
                        <span>Closed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {emergencies.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No recent emergencies
              </div>
            )}
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Service Status</h3>
          </div>
          
          <div className="p-6 space-y-4">
            {(Array.isArray(services) ? services : Object.entries(services || {}).map(([name, data]) => ({
              id: name.toLowerCase().replace(/\s+/g, '_'),
              service_type: name,
              available_units: (data as any).available_units,
              total_units: (data as any).total_units,
              status: (data as any).status,
              average_response_time: Math.floor(Math.random() * 8) + 3 // Mock response time
            }))).map((service) => (
              <div key={service.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{service.service_type}</p>
                  <p className="text-xs text-gray-500">
                    {service.available_units} units • {service.average_response_time}m avg
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    service.status === 'active' ? 'bg-green-500' :
                    service.status === 'limited' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-gray-600 capitalize">{service.status}</span>
                </div>
              </div>
            ))}
            
            {services.length === 0 && (
              <p className="text-sm text-gray-500 text-center">No service data available</p>
            )}
          </div>
        </div>
        
        {/* Emergency Map */}
        <div className="lg:col-span-3">
          <EmergencyMap emergencies={emergencies} />
        </div>
      </div>

      {/* Emergency Analytics */}
      <div className="mt-6">
        <EmergencyAnalytics emergencies={emergencies} />
      </div>

      {/* Emergency Details Modal */}
      {selectedEmergency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Emergency Details</h3>
                <div className="flex items-center space-x-2">
                  {selectedEmergency.status === 'ACTIVE' && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to close this emergency?')) {
                          closeEmergency(selectedEmergency.id);
                          setSelectedEmergency(null);
                        }
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                    >
                      <CheckCircle size={16} />
                      <span>Close Emergency</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedEmergency(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type & Priority</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg">{getEmergencyIcon(selectedEmergency.emergency_type)}</span>
                    <span className="font-medium">{selectedEmergency.emergency_type.replace('_', ' ')}</span>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(selectedEmergency.priority_level)}`}>
                      {selectedEmergency.priority_level}
                    </span>
                  </div>
                </div>

                {/* Emergency Description/Content */}
                {selectedEmergency.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Description</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedEmergency.notes}</p>
                    </div>
                  </div>
                )}

                {/* Audio File - if available */}
                {selectedEmergency.context_data?.audio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Audio</label>
                    <div className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-blue-700">🎵 Audio recording from emergency report</span>
                      </div>
                      <audio 
                        controls 
                        className="w-full"
                        src={selectedEmergency.context_data.audio}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )}

                {/* Fallback for emergencies without description */}
                {!selectedEmergency.notes && !selectedEmergency.context_data?.audio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Content</label>
                    <div className="mt-1 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-700">
                        📝 No description or audio available for this emergency
                      </p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-sm rounded-full ${getStatusColor(selectedEmergency.status)}`}>
                      {selectedEmergency.status}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Time</label>
                  <p className="mt-1 text-sm">{format(new Date(selectedEmergency.created_at), 'PPpp')}</p>
                </div>
                
                {selectedEmergency.location_lat && selectedEmergency.location_lon && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="mt-1 text-sm font-mono">
                      {selectedEmergency.location_lat.toFixed(6)}, {selectedEmergency.location_lon.toFixed(6)}
                    </p>
                  </div>
                )}
                

                
                <div>
                  <label className="text-sm font-medium text-gray-500">Emergency ID</label>
                  <p className="mt-1 text-sm font-mono">{selectedEmergency.id}</p>
                </div>

                {/* Weather and Traffic Context */}
                {selectedEmergency.context_data && (
                  <>
                    {selectedEmergency.context_data.weather && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Weather Conditions</label>
                        <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Conditions:</span>
                              <span className="ml-1 font-medium">{selectedEmergency.context_data.weather.conditions}</span>
                            </div>
                            {selectedEmergency.context_data.weather.temperature && (
                              <div>
                                <span className="text-gray-600">Temperature:</span>
                                <span className="ml-1 font-medium">{selectedEmergency.context_data.weather.temperature}°C</span>
                              </div>
                            )}
                            {selectedEmergency.context_data.weather.wind_speed && (
                              <div>
                                <span className="text-gray-600">Wind Speed:</span>
                                <span className="ml-1 font-medium">{selectedEmergency.context_data.weather.wind_speed} km/h</span>
                              </div>
                            )}
                            {selectedEmergency.context_data.weather.visibility && (
                              <div>
                                <span className="text-gray-600">Visibility:</span>
                                <span className="ml-1 font-medium">{selectedEmergency.context_data.weather.visibility} km</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedEmergency.context_data.traffic && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Traffic Conditions</label>
                        <div className="mt-1 p-3 bg-yellow-50 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Congestion:</span>
                              <span className={`ml-1 font-medium ${
                                selectedEmergency.context_data.traffic.congestion_level === 'high' ? 'text-red-600' :
                                selectedEmergency.context_data.traffic.congestion_level === 'medium' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {selectedEmergency.context_data.traffic.congestion_level.toUpperCase()}
                              </span>
                            </div>
                            {selectedEmergency.context_data.traffic.average_speed && (
                              <div>
                                <span className="text-gray-600">Avg Speed:</span>
                                <span className="ml-1 font-medium">{selectedEmergency.context_data.traffic.average_speed} km/h</span>
                              </div>
                            )}
                          </div>
                          {selectedEmergency.context_data.traffic.incidents && selectedEmergency.context_data.traffic.incidents.length > 0 && (
                            <div className="mt-2">
                              <span className="text-gray-600 text-sm">Traffic Incidents:</span>
                              <ul className="mt-1 text-sm text-red-600">
                                {selectedEmergency.context_data.traffic.incidents.map((incident: any, index: number) => (
                                  <li key={index}>• {incident.description || 'Traffic incident reported'}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedEmergency.context_data.fire_stations && selectedEmergency.context_data.fire_stations.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Nearby Fire Stations</label>
                        <div className="mt-1 p-3 bg-red-50 rounded-lg">
                          <div className="space-y-2">
                            {selectedEmergency.context_data.fire_stations.slice(0, 3).map((station: any, index: number) => (
                              <div key={index} className="text-sm">
                                <div className="font-medium">{station.name}</div>
                                <div className="text-gray-600">
                                  {station.distance}km away • {station.response_time}min ETA • {station.available_units} units
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}