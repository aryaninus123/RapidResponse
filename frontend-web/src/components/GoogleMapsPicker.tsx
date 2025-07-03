'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { Search, MapPin, Crosshair, AlertCircle } from 'lucide-react';
import { Location } from '@/types/emergency';
import { useGoogleMaps } from './GoogleMapsProvider';

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 37.7749, // San Francisco
  lng: -122.4194
};

interface GoogleMapsPickerProps {
  initialLocation?: Location | null;
  onLocationSelect: (location: Location) => void;
  className?: string;
}

export function GoogleMapsPicker({
  initialLocation,
  onLocationSelect,
  className = '',
}: GoogleMapsPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [searchValue, setSearchValue] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use shared Google Maps context
  const { isLoaded, loadError } = useGoogleMaps();

  // Google Maps API key from environment variables
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const location = { lat, lon: lng };
      
      setSelectedLocation(location);
      onLocationSelect(location);
    }
  }, [onLocationSelect]);

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

        // Center map on current location
        if (map) {
          map.panTo({ lat: location.lat, lng: location.lon });
          map.setZoom(15);
        }
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
  }, [onLocationSelect, map]);

  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const location = { lat, lon: lng };
        
        setSelectedLocation(location);
        onLocationSelect(location);
        setSearchValue(place.formatted_address || '');

        // Center map on selected place
        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(15);
        }
      }
    }
  }, [autocomplete, onLocationSelect, map]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    console.log('✅ Google Maps loaded successfully');
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
    console.log('✅ Google Places autocomplete loaded successfully');
  }, []);

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
    return (
      <div className={`${className} p-6 bg-yellow-50 border border-yellow-200 rounded-lg`}>
        <div className="text-center">
          <MapPin size={48} className="mx-auto mb-2 text-yellow-500" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Google Maps API Key Required</h3>
          <p className="text-sm text-yellow-700 mb-4">
            To use the interactive map, please add your Google Maps API key to the environment variables.
          </p>
          <div className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded border text-left">
            <p className="font-medium mb-1">Setup Instructions:</p>
            <p>1. Get a Google Maps API key from Google Cloud Console</p>
            <p>2. Enable Maps JavaScript API and Places API</p>
            <p>3. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file</p>
          </div>
          
          {/* Fallback location picker */}
          <div className="mt-4">
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center mx-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            >
              <Crosshair size={16} className="mr-2" />
              {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
            </button>
            
            {selectedLocation && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">Location Selected</p>
                <p className="text-sm text-green-600">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`${className} p-6 bg-red-50 border border-red-200 rounded-lg`}>
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-2 text-red-500" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Google Maps Error</h3>
          <p className="text-sm text-red-700 mb-4">Failed to load Google Maps</p>
          <div className="text-xs text-red-600 bg-red-100 p-2 rounded border text-left">
            <p className="font-medium mb-1">Common Solutions:</p>
            <p>1. Check that your API key is valid</p>
            <p>2. Ensure Maps JavaScript API and Places API are enabled</p>
            <p>3. Verify API key restrictions (referrers, IPs)</p>
            <p>4. Check browser console for detailed error messages</p>
          </div>
          
          {/* Fallback location picker */}
          <div className="mt-4">
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center mx-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            >
              <Crosshair size={16} className="mr-2" />
              {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
            </button>
            
            {selectedLocation && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">Location Selected</p>
                <p className="text-sm text-green-600">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`google-maps-picker ${className}`}>
      <div className="space-y-4">
        
        {/* Controls */}
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
        </div>

        {/* Diagnostic Info */}
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <p>🔑 API Key: {GOOGLE_MAPS_API_KEY.slice(0, 20)}...</p>
          <p>📡 Status: {!isLoaded ? 'Loading...' : 'Ready'}</p>
        </div>

        {/* Google Maps - Only render when loaded */}
        {isLoaded ? (
          <div className="space-y-2">
            {/* Places Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for a location..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </Autocomplete>
            </div>

            {/* Map */}
            <div className="rounded-lg overflow-hidden border border-gray-300">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={
                  selectedLocation 
                    ? { lat: selectedLocation.lat, lng: selectedLocation.lon }
                    : defaultCenter
                }
                zoom={selectedLocation ? 15 : 10}
                onClick={handleMapClick}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: true,
                  zoomControl: true,
                }}
              >
                {selectedLocation && (
                  <Marker
                    position={{ lat: selectedLocation.lat, lng: selectedLocation.lon }}
                    title="Selected Location"
                    icon={{
                      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 2C11.5817 2 8 5.58172 8 10C8 16 16 30 16 30C16 30 24 16 24 10C24 5.58172 20.4183 2 16 2Z" fill="#EF4444"/>
                          <circle cx="16" cy="10" r="4" fill="white"/>
                        </svg>
                      `),
                      scaledSize: new google.maps.Size(32, 32),
                      anchor: new google.maps.Point(16, 32),
                    }}
                  />
                )}
              </GoogleMap>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg border border-gray-300">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading Google Maps...</p>
            </div>
          </div>
        )}

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

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>🗺️ Click anywhere on the map to select a location</p>
          <p>🔍 Use the search box to find specific addresses</p>
          <p>📍 Emergency responders will use this location to find you</p>
          <p>🎯 Be as accurate as possible for fastest response</p>
        </div>
      </div>
    </div>
  );
} 