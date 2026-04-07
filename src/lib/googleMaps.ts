// Google Maps utilities

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Open location in Google Maps app or web
 * Works on both mobile and desktop
 */
export const openInGoogleMaps = (location: Location) => {
  const { latitude, longitude, address } = location;
  
  // For mobile devices, try to open native Google Maps app
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Try to open in Google Maps app (works on both iOS and Android)
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(mapsUrl, '_blank');
  } else {
    // For desktop, open in new tab with directions
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(mapsUrl, '_blank');
  }
};

/**
 * Get navigation URL for Google Maps
 */
export const getNavigationUrl = (location: Location): string => {
  const { latitude, longitude } = location;
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
};

/**
 * Open location in Google Maps with current location as starting point
 */
export const navigateToLocation = async (destination: Location) => {
  try {
    // Get current location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: currentLat, longitude: currentLng } = position.coords;
          const { latitude: destLat, longitude: destLng } = destination;
          
          // Open Google Maps with directions from current location to destination
          const mapsUrl = `https://www.google.com/maps/dir/${currentLat},${currentLng}/${destLat},${destLng}`;
          window.open(mapsUrl, '_blank');
        },
        (error) => {
          console.warn('Could not get current location:', error);
          // Fallback: open destination without starting point
          openInGoogleMaps(destination);
        }
      );
    } else {
      // Geolocation not supported, open destination directly
      openInGoogleMaps(destination);
    }
  } catch (error) {
    console.error('Error navigating to location:', error);
    openInGoogleMaps(destination);
  }
};

/**
 * Calculate distance between two locations (in kilometers)
 */
export const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(loc2.latitude - loc1.latitude);
  const dLon = toRad(loc2.longitude - loc1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.latitude)) *
    Math.cos(toRad(loc2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Reverse geocode coordinates to get address
 * Uses Google Geocoding API to convert lat/lng to human-readable address
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  const apiKey = import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY;
  
  if (!apiKey) {
    throw new Error('Location service is temporarily unavailable. Please enter your address manually.');
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Unable to fetch address. Please enter your address manually.');
    }

    const data = await response.json();

    // Handle Google API errors gracefully
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Return the formatted address from the first result
      return data.results[0].formatted_address;
    } else if (data.status === 'ZERO_RESULTS') {
      throw new Error('No address found for this location. Please enter your address manually.');
    } else if (data.status === 'REQUEST_DENIED') {
      // API key not authorized - show user-friendly message
      console.error('Google Geocoding API not enabled. Please enable it in Google Cloud Console.');
      throw new Error('Location service is currently unavailable. Please enter your address manually.');
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('Location service is busy. Please try again in a moment or enter your address manually.');
    } else {
      // Generic error - don't expose technical details to users
      console.error('Geocoding API error:', data.status, data.error_message);
      throw new Error('Unable to get address automatically. Please enter your address manually.');
    }
  } catch (error: any) {
    console.error('Reverse geocoding error:', error);
    // If it's already a user-friendly error, re-throw it
    if (error.message && error.message.includes('manually')) {
      throw error;
    }
    // Otherwise, provide a generic user-friendly message
    throw new Error('Unable to get address automatically. Please enter your address manually.');
  }
};
