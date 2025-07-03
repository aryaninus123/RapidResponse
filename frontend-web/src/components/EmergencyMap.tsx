'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, AlertTriangle, Clock, Users } from 'lucide-react';
import { Emergency } from '@/types/emergency';
import { useGoogleMaps } from './GoogleMapsProvider';

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 37.7749, // San Francisco
  lng: -122.4194
};

interface EmergencyMapProps {
  emergencies: Emergency[];
}

export function EmergencyMap({ emergencies }: EmergencyMapProps) {
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  // Use shared Google Maps context
  const { isLoaded, loadError } = useGoogleMaps();
  
  // Google Maps API key
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

  // Calculate center and zoom based on emergencies
  const calculateMapCenter = useCallback(() => {
    const validEmergencies = emergencies.filter(e => e.location_lat && e.location_lon);
    
    if (validEmergencies.length === 0) {
      return defaultCenter;
    }

    if (validEmergencies.length === 1) {
      return {
        lat: validEmergencies[0].location_lat!,
        lng: validEmergencies[0].location_lon!
      };
    }

    // Calculate center point of all emergencies
    const latSum = validEmergencies.reduce((sum, e) => sum + e.location_lat!, 0);
    const lngSum = validEmergencies.reduce((sum, e) => sum + e.location_lon!, 0);
    
    return {
      lat: latSum / validEmergencies.length,
      lng: lngSum / validEmergencies.length
    };
  }, [emergencies]);

  // Update map center when emergencies change
  useEffect(() => {
    const newCenter = calculateMapCenter();
    setMapCenter(newCenter);
    
    // If map is loaded, pan to new center
    if (map && emergencies.length > 0) {
      map.panTo(newCenter);
      
      // Adjust zoom based on spread of emergencies
      if (emergencies.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        emergencies.filter(e => e.location_lat && e.location_lon).forEach(e => {
          bounds.extend({ lat: e.location_lat!, lng: e.location_lon! });
        });
        map.fitBounds(bounds);
      }
    }
  }, [emergencies, map, calculateMapCenter]);

  const getEmergencyColor = (type: string, priority: string) => {
    const colors = {
      FIRE: priority === 'HIGH' ? '#dc2626' : '#ea580c',
      MEDICAL: priority === 'HIGH' ? '#dc2626' : '#2563eb', 
      CRIME: priority === 'HIGH' ? '#7c2d12' : '#92400e',
      TRAFFIC: priority === 'HIGH' ? '#dc2626' : '#d97706',
      NATURAL_DISASTER: '#7c2d12',
      OTHER: '#6b7280'
    };
    return colors[type as keyof typeof colors] || colors.OTHER;
  };

  const getEmergencyIcon = (type: string) => {
    const icons = {
      FIRE: '🔥',
      MEDICAL: '🚑',
      CRIME: '🚨',
      TRAFFIC: '🚗',
      NATURAL_DISASTER: '⛈️',
      OTHER: '⚠️'
    };
    return icons[type as keyof typeof icons] || icons.OTHER;
  };

  const createMarkerIcon = (emergency: Emergency) => {
    const color = getEmergencyColor(emergency.emergency_type, emergency.priority_level);
    const icon = getEmergencyIcon(emergency.emergency_type);
    
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/>
          <text x="20" y="26" text-anchor="middle" font-size="16" fill="white">${icon}</text>
          ${emergency.status === 'ACTIVE' ? `
            <circle cx="20" cy="20" r="18" fill="none" stroke="${color}" stroke-width="2" opacity="0.6">
              <animate attributeName="r" values="18;25;18" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
            </circle>
          ` : ''}
        </svg>
      `),
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20),
    };
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Emergency Map</h3>
          <p className="text-sm text-gray-500">{emergencies.length} active emergencies</p>
        </div>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <MapPin size={48} className="mx-auto mb-2 text-yellow-500" />
            <h4 className="text-lg font-medium text-yellow-800 mb-2">Google Maps API Required</h4>
            <p className="text-sm text-yellow-700">
              Configure Google Maps API key to show emergency locations on an interactive map.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Emergency Map</h3>
          <p className="text-sm text-gray-500">{emergencies.length} active emergencies</p>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <AlertTriangle size={48} className="mx-auto mb-2 text-red-500" />
            <h4 className="text-lg font-medium text-red-800 mb-2">Map Loading Error</h4>
            <p className="text-sm text-red-700">
              Failed to load Google Maps. Please check your API configuration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Emergency Map</h3>
        <p className="text-sm text-gray-500">{emergencies.length} active emergencies</p>
      </div>
      
      <div className="p-6">
        {/* Google Maps Container */}
        <div className="rounded-lg overflow-hidden border border-gray-300 shadow-sm">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={emergencies.length > 1 ? 10 : 13}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
                zoomControl: true,
                styles: [
                  {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                  }
                ]
              }}
            >
              {/* Emergency Markers */}
              {emergencies
                .filter(e => e.location_lat && e.location_lon)
                .map((emergency) => (
                  <Marker
                    key={emergency.id}
                    position={{ 
                      lat: emergency.location_lat!, 
                      lng: emergency.location_lon! 
                    }}
                    icon={createMarkerIcon(emergency)}
                    onClick={() => setSelectedEmergency(emergency)}
                    title={`${emergency.emergency_type} - ${emergency.priority_level}`}
                  />
                ))}

              {/* Info Window */}
              {selectedEmergency && (
                <InfoWindow
                  position={{
                    lat: selectedEmergency.location_lat!,
                    lng: selectedEmergency.location_lon!
                  }}
                  onCloseClick={() => setSelectedEmergency(null)}
                >
                  <div className="p-3 max-w-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getEmergencyIcon(selectedEmergency.emergency_type)}</span>
                        <span className="font-medium text-gray-900">
                          {selectedEmergency.emergency_type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedEmergency.priority_level === 'HIGH' ? 'bg-red-100 text-red-800' :
                        selectedEmergency.priority_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedEmergency.priority_level}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{new Date(selectedEmergency.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin size={14} />
                        <span>{selectedEmergency.location_lat?.toFixed(4)}, {selectedEmergency.location_lon?.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <AlertTriangle size={14} />
                        <span className={`font-medium ${
                          selectedEmergency.status === 'ACTIVE' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {selectedEmergency.status}
                        </span>
                      </div>
                      {selectedEmergency.notes && (
                        <div className="mt-2 text-sm text-gray-700">
                          <strong>Notes:</strong> {selectedEmergency.notes.substring(0, 100)}
                          {selectedEmergency.notes.length > 100 && '...'}
                        </div>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading Emergency Map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Map Legend */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Emergency Types</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['FIRE', 'MEDICAL', 'CRIME', 'TRAFFIC'].map(type => {
              const count = emergencies.filter(e => e.emergency_type === type).length;
              return (
                <div key={type} className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl mb-1">{getEmergencyIcon(type)}</div>
                  <div className="text-lg font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-500">{type}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map Info */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          🗺️ Click on markers to view emergency details • Real-time emergency locations
        </div>
      </div>
    </div>
  );
} 