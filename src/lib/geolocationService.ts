/**
 * Enhanced Geolocation Service
 * Uses Google Geolocation API as fallback when browser geolocation fails
 */

import { getApiKey } from './googleMapsConfig';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

/**
 * Get current location using browser geolocation
 */
export async function getBrowserLocation(): Promise<LocationCoordinates | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error('Browser geolocation error:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Get location using Google Geolocation API
 * Fallback when browser geolocation is not available or denied
 */
export async function getGoogleGeolocation(): Promise<LocationCoordinates | null> {
  const apiKey = getApiKey(); // Use primary key
  
  if (!apiKey) {
    console.error('Google API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          considerIp: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Google Geolocation API request failed');
    }

    const data = await response.json();
    
    return {
      lat: data.location.lat,
      lng: data.location.lng,
      accuracy: data.accuracy,
    };
  } catch (error) {
    console.error('Google Geolocation API error:', error);
    return null;
  }
}

/**
 * Get current location with fallback
 * Tries browser geolocation first, then Google Geolocation API
 */
export async function getCurrentLocation(): Promise<LocationCoordinates | null> {
  // Try browser geolocation first
  const browserLocation = await getBrowserLocation();
  if (browserLocation) {
    return browserLocation;
  }

  // Fallback to Google Geolocation API
  console.log('Browser geolocation failed, trying Google Geolocation API...');
  const googleLocation = await getGoogleGeolocation();
  return googleLocation;
}

/**
 * Watch location with high accuracy
 */
export function watchLocation(
  callback: (location: LocationCoordinates) => void,
  errorCallback?: (error: GeolocationPositionError) => void
): number | null {
  if (!navigator.geolocation) {
    console.error('Geolocation is not supported by this browser');
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    (error) => {
      console.error('Error watching location:', error);
      if (errorCallback) {
        errorCallback(error);
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

/**
 * Clear location watch
 */
export function clearLocationWatch(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Check if geolocation permission is granted
 */
export async function checkGeolocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!navigator.permissions) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch (error) {
    console.error('Error checking geolocation permission:', error);
    return 'prompt';
  }
}

/**
 * Request geolocation permission
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  try {
    const location = await getBrowserLocation();
    return location !== null;
  } catch (error) {
    console.error('Error requesting geolocation permission:', error);
    return false;
  }
}
