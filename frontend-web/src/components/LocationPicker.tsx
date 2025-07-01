'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Crosshair } from 'lucide-react';
import { Location } from '@/types/emergency';

interface LocationPickerProps {
  initialLocation?: Location | null;
  onLocationSelect: (location: Location) => void;
  className?: string;
}

export function LocationPicker({
  initialLocation,
  onLocationSelect,
  className = '',
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  const getCurrentLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setSelectedLocation(location);
        onLocationSelect(location);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
        
        let errorMessage = 'Failed to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [onLocationSelect]);

  const handleManualLocationInput = useCallback(() => {
    const latInput = prompt('Enter latitude (-90 to 90):');
    const lonInput = prompt('Enter longitude (-180 to 180):');
    
    if (latInput && lonInput) {
      const lat = parseFloat(latInput);
      const lon = parseFloat(lonInput);
      
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        alert('Invalid coordinates. Please enter valid latitude (-90 to 90) and longitude (-180 to 180).');
        return;
      }
      
      const location = { lat, lon };
      setSelectedLocation(location);
      onLocationSelect(location);
    }
  }, [onLocationSelect]);

  // Simple map placeholder - in a real app you'd integrate with Mapbox or Google Maps
  const MapPlaceholder = () => (
    <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <MapPin size={48} className="mx-auto mb-2" />
        <p className="text-sm">Interactive Map</p>
        <p className="text-xs">Click to select emergency location</p>
        {selectedLocation && (
          <div className="mt-2 p-2 bg-white rounded border">
            <p className="text-xs font-medium">Selected Location:</p>
            <p className="text-xs">
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`location-picker ${className}`}>
      <div className="space-y-4">
        
        {/* Location Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
          >
            <Crosshair size={16} className="mr-2" />
            {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
          </button>

          <button
            type="button"
            onClick={handleManualLocationInput}
            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <MapPin size={16} className="mr-2" />
            Enter Coordinates
          </button>

          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <MapPin size={16} className="mr-2" />
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Location Selected</p>
                <p className="text-sm text-green-600">
                  Lat: {selectedLocation.lat.toFixed(6)}, Lon: {selectedLocation.lon.toFixed(6)}
                </p>
              </div>
              <MapPin className="text-green-500" size={20} />
            </div>
          </div>
        )}

        {/* Map Display */}
        {showMap && (
          <div ref={mapRef}>
            <MapPlaceholder />
            <p className="mt-2 text-xs text-gray-500 text-center">
              Note: In production, this would show an interactive map (Mapbox, Google Maps, etc.)
            </p>
          </div>
        )}

        {/* Location Info */}
        <div className="text-xs text-gray-500">
          <p>📍 Emergency responders will use this location to find you</p>
          <p>🎯 Be as accurate as possible for fastest response</p>
          <p>📱 Enable location permissions for best experience</p>
        </div>
      </div>
    </div>
  );
} 