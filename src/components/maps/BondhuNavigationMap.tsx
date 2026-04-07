/**
 * Bondhu Navigation Map Component
 * Provides turn-by-turn navigation for Bondhu to reach task location
 */

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useLoadScript } from '@react-google-maps/api';
import { GOOGLE_MAPS_CONFIG } from '@/lib/googleMapsConfig';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation, MapPin, Clock, TrendingUp } from 'lucide-react';

interface BondhuNavigationMapProps {
  taskLocation: { lat: number; lng: number };
  currentLocation: { lat: number; lng: number } | null;
  taskAddress: string;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = { lat: 23.8103, lng: 90.4125 }; // Dhaka, Bangladesh

const libraries: ("places" | "geometry")[] = ['places', 'geometry'];

export function BondhuNavigationMap({
  taskLocation,
  currentLocation,
  taskAddress,
  onLocationUpdate,
}: BondhuNavigationMapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.primaryKey,
    libraries,
  });
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [calculating, setCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string>('');

  // Haversine formula for fallback distance calculation
  const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(2)} km`;
  };

  // Calculate ETA based on distance (assuming average speed of 30 km/h)
  const calculateETA = (distanceKm: number): string => {
    const hours = distanceKm / 30; // Average speed 30 km/h
    const minutes = Math.round(hours * 60);
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs} hr ${mins} min`;
  };

  // Calculate route when locations change
  useEffect(() => {
    if (!isLoaded || !currentLocation || !taskLocation) {
      // Use fallback calculation if Google Maps not loaded
      if (currentLocation && taskLocation) {
        const fallbackDistance = calculateHaversineDistance(
          currentLocation.lat,
          currentLocation.lng,
          taskLocation.lat,
          taskLocation.lng
        );
        setDistance(fallbackDistance);
        
        // Extract numeric distance for ETA calculation
        const distanceNum = parseFloat(fallbackDistance.replace(/[^\d.]/g, ''));
        const distanceKm = fallbackDistance.includes('m') ? distanceNum / 1000 : distanceNum;
        setDuration(calculateETA(distanceKm));
      }
      return;
    }

    setCalculating(true);
    setCalculationError('');

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
        destination: new google.maps.LatLng(taskLocation.lat, taskLocation.lng),
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        provideRouteAlternatives: false,
      },
      (result, status) => {
        setCalculating(false);
        
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);

          // Extract distance and duration
          const route = result.routes[0];
          if (route && route.legs[0]) {
            setDistance(route.legs[0].distance?.text || '');
            setDuration(route.legs[0].duration?.text || '');

            // Get current step instruction
            if (route.legs[0].steps && route.legs[0].steps.length > 0) {
              const firstStep = route.legs[0].steps[0];
              setCurrentStep(firstStep.instructions || '');
            }
          }
        } else {
          console.error('Directions request failed:', status);
          setCalculationError(`Unable to calculate route: ${status}`);
          
          // Fallback to Haversine distance
          const fallbackDistance = calculateHaversineDistance(
            currentLocation.lat,
            currentLocation.lng,
            taskLocation.lat,
            taskLocation.lng
          );
          setDistance(fallbackDistance);
          
          // Extract numeric distance for ETA calculation
          const distanceNum = parseFloat(fallbackDistance.replace(/[^\d.]/g, ''));
          const distanceKm = fallbackDistance.includes('m') ? distanceNum / 1000 : distanceNum;
          setDuration(calculateETA(distanceKm));
        }
      }
    );
  }, [isLoaded, currentLocation, taskLocation]);

  // Auto-fit bounds to show both locations
  useEffect(() => {
    if (!map || !currentLocation || !taskLocation) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(currentLocation);
    bounds.extend(taskLocation);
    map.fitBounds(bounds);
  }, [map, currentLocation, taskLocation]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] bg-muted animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  const center = currentLocation || taskLocation || defaultCenter;

  return (
    <div className="space-y-4">
      {/* Navigation Info Cards */}
      {currentLocation && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Distance</p>
                <p className="text-lg font-semibold">
                  {calculating ? (
                    <span className="text-muted-foreground animate-pulse">Calculating...</span>
                  ) : distance || 'N/A'}
                </p>
                {calculationError && (
                  <p className="text-xs text-muted-foreground">(Estimated)</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ETA</p>
                <p className="text-lg font-semibold">
                  {calculating ? (
                    <span className="text-muted-foreground animate-pulse">Calculating...</span>
                  ) : duration || 'N/A'}
                </p>
                {calculationError && (
                  <p className="text-xs text-muted-foreground">(Estimated)</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <MapPin className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Destination</p>
                <p className="text-sm font-medium truncate">{taskAddress}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Current Navigation Instruction */}
      {currentStep && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Navigation className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary mb-1">Next Turn</p>
              <div 
                className="text-sm text-foreground"
                dangerouslySetInnerHTML={{ __html: currentStep }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Map */}
      <Card className="overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={14}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {/* Current Location Marker */}
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#3B82F6',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
              }}
              title="Your Location"
            />
          )}

          {/* Task Location Marker */}
          <Marker
            position={taskLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#EF4444',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3,
            }}
            title={taskAddress}
            label={{
              text: '📍',
              fontSize: '20px',
            }}
          />

          {/* Directions Route */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#3B82F6',
                  strokeWeight: 5,
                  strokeOpacity: 0.8,
                },
              }}
            />
          )}
        </GoogleMap>
      </Card>

      {/* Location Status */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span>Location tracking active</span>
        </div>
        {currentLocation && (
          <Badge variant="outline">
            {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </Badge>
        )}
      </div>
    </div>
  );
}
