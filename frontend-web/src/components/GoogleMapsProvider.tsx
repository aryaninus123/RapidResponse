'use client';

import React, { createContext, useContext } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries: ("places")[] = ["places"];

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
});

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

  console.log('🗺️ GoogleMapsProvider: Initializing with API key:', GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET');

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
    preventGoogleFontsLoading: true,
  });

  console.log('🗺️ GoogleMapsProvider: isLoaded =', isLoaded, 'loadError =', loadError);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
} 