/**
 * Google Maps API Configuration
 * Manages multiple API keys for different Google Maps services
 */

export const GOOGLE_MAPS_CONFIG = {
  // Primary API Key - Used for Maps JavaScript API
  primaryKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  
  // Individual Service Keys
  javascriptApi: import.meta.env.VITE_GOOGLE_MAPS_JAVASCRIPT_API_KEY,
  androidApi: import.meta.env.VITE_GOOGLE_MAPS_ANDROID_API_KEY,
  placesApi: import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
  geocodingApi: import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY,
  distanceMatrixApi: import.meta.env.VITE_GOOGLE_DISTANCE_MATRIX_API_KEY,
  directionsApi: import.meta.env.VITE_GOOGLE_DIRECTIONS_API_KEY,
  roadsApi: import.meta.env.VITE_GOOGLE_ROADS_API_KEY,
};

/**
 * Get the appropriate API key for a specific service
 */
export function getApiKey(service?: 'places' | 'geocoding' | 'distance' | 'directions' | 'roads'): string {
  switch (service) {
    case 'places':
      return GOOGLE_MAPS_CONFIG.placesApi || GOOGLE_MAPS_CONFIG.primaryKey;
    case 'geocoding':
      return GOOGLE_MAPS_CONFIG.geocodingApi || GOOGLE_MAPS_CONFIG.primaryKey;
    case 'distance':
      return GOOGLE_MAPS_CONFIG.distanceMatrixApi || GOOGLE_MAPS_CONFIG.primaryKey;
    case 'directions':
      return GOOGLE_MAPS_CONFIG.directionsApi || GOOGLE_MAPS_CONFIG.primaryKey;
    case 'roads':
      return GOOGLE_MAPS_CONFIG.roadsApi || GOOGLE_MAPS_CONFIG.primaryKey;
    default:
      return GOOGLE_MAPS_CONFIG.primaryKey;
  }
}

/**
 * Validate that all required API keys are configured
 */
export function validateApiKeys(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!GOOGLE_MAPS_CONFIG.primaryKey) {
    missing.push('Primary Maps API Key');
  }
  
  if (!GOOGLE_MAPS_CONFIG.javascriptApi) {
    missing.push('Maps JavaScript API Key');
  }
  
  if (!GOOGLE_MAPS_CONFIG.placesApi) {
    missing.push('Places API Key');
  }
  
  if (!GOOGLE_MAPS_CONFIG.geocodingApi) {
    missing.push('Geocoding API Key');
  }
  
  if (!GOOGLE_MAPS_CONFIG.distanceMatrixApi) {
    missing.push('Distance Matrix API Key');
  }
  
  if (!GOOGLE_MAPS_CONFIG.directionsApi) {
    missing.push('Directions API Key');
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Check if Google Maps is properly configured
 */
export function isGoogleMapsConfigured(): boolean {
  return !!GOOGLE_MAPS_CONFIG.primaryKey && 
         GOOGLE_MAPS_CONFIG.primaryKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
}

/**
 * Get configuration status for debugging
 */
export function getConfigStatus() {
  return {
    primaryKey: GOOGLE_MAPS_CONFIG.primaryKey ? '✅ Configured' : '❌ Missing',
    javascriptApi: GOOGLE_MAPS_CONFIG.javascriptApi ? '✅ Configured' : '❌ Missing',
    androidApi: GOOGLE_MAPS_CONFIG.androidApi ? '✅ Configured' : '❌ Missing',
    placesApi: GOOGLE_MAPS_CONFIG.placesApi ? '✅ Configured' : '❌ Missing',
    geocodingApi: GOOGLE_MAPS_CONFIG.geocodingApi ? '✅ Configured' : '❌ Missing',
    distanceMatrixApi: GOOGLE_MAPS_CONFIG.distanceMatrixApi ? '✅ Configured' : '❌ Missing',
    directionsApi: GOOGLE_MAPS_CONFIG.directionsApi ? '✅ Configured' : '❌ Missing',
    roadsApi: GOOGLE_MAPS_CONFIG.roadsApi ? '✅ Configured' : '❌ Missing',
  };
}

// Log configuration status in development
if (import.meta.env.DEV) {
  console.log('🗺️ Google Maps Configuration Status:', getConfigStatus());
  
  const validation = validateApiKeys();
  if (!validation.valid) {
    console.warn('⚠️ Missing API Keys:', validation.missing);
  } else {
    console.log('✅ All Google Maps API keys are configured');
  }
}
