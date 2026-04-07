import { getCurrentLocation as getLocation, watchLocation as watchLoc, clearLocationWatch as clearWatch } from './geolocationService';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get current user location using enhanced geolocation service
 * @returns Promise with coordinates or null if failed
 */
export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  return await getLocation();
}

/**
 * Watch user location for real-time tracking
 * @param callback Function to call when location updates
 * @returns Watch ID that can be used to clear the watch
 */
export function watchLocation(
  callback: (location: { lat: number; lng: number }) => void
): number | null {
  return watchLoc(callback);
}

/**
 * Clear location watch
 * @param watchId Watch ID returned from watchLocation
 */
export function clearLocationWatch(watchId: number): void {
  clearWatch(watchId);
}

/**
 * Format distance for display
 * @param distanceInKm Distance in kilometers
 * @returns Formatted string (e.g., "1.5 km" or "500 m")
 */
export function formatDistance(distanceInKm: number): string {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)} m`;
  }
  return `${distanceInKm.toFixed(1)} km`;
}

/**
 * Check if a location is within a certain radius of another location
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param pointLat Point latitude
 * @param pointLng Point longitude
 * @param radiusKm Radius in kilometers
 * @returns True if point is within radius
 */
export function isWithinRadius(
  centerLat: number,
  centerLng: number,
  pointLat: number,
  pointLng: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(centerLat, centerLng, pointLat, pointLng);
  return distance <= radiusKm;
}

/**
 * Get the center point of multiple coordinates
 * @param coordinates Array of {lat, lng} objects
 * @returns Center point
 */
export function getCenterPoint(
  coordinates: Array<{ lat: number; lng: number }>
): { lat: number; lng: number } {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length,
  };
}
