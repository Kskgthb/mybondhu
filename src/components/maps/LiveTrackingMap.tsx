import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock } from 'lucide-react';
import AnimatedBicycleMarker from './AnimatedBicycleMarker';

interface Location {
  lat: number;
  lng: number;
}

interface LiveTrackingMapProps {
  taskLocation: Location;
  bondhuLocation?: Location;
  taskAddress?: string;
  bondhuName?: string;
  showDirections?: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

export default function LiveTrackingMap({
  taskLocation,
  bondhuLocation,
  taskAddress,
  bondhuName = 'Bondhu',
  showDirections = true
}: LiveTrackingMapProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Calculate route when bondhu location changes
  useEffect(() => {
    if (!window.google?.maps || !bondhuLocation || !showDirections) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: new window.google.maps.LatLng(bondhuLocation.lat, bondhuLocation.lng),
        destination: new window.google.maps.LatLng(taskLocation.lat, taskLocation.lng),
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        provideRouteAlternatives: false,
      },
      (result, status) => {
        if (window.google?.maps && status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          
          // Extract distance and duration
          const route = result.routes[0];
          if (route && route.legs[0]) {
            setDistance(route.legs[0].distance?.text || '');
            setDuration(route.legs[0].duration?.text || '');
          }
        } else {
          console.error('Directions request failed:', status);
          
          // Fallback: Calculate straight-line distance
          if (window.google?.maps?.geometry) {
            const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
              new window.google.maps.LatLng(bondhuLocation.lat, bondhuLocation.lng),
              new window.google.maps.LatLng(taskLocation.lat, taskLocation.lng)
            );
            
            const distanceKm = distance / 1000;
            setDistance(distanceKm < 1 ? `${Math.round(distance)} m` : `${distanceKm.toFixed(2)} km`);
            
            // Estimate duration (assuming 30 km/h average speed)
            const durationMinutes = Math.round((distanceKm / 30) * 60);
            setDuration(durationMinutes < 60 ? `${durationMinutes} min` : `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60} min`);
          }
        }
      }
    );
  }, [bondhuLocation, taskLocation, showDirections]);

  // Fit bounds to show both markers
  useEffect(() => {
    if (!window.google?.maps || !mapRef.current || !bondhuLocation) return;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(taskLocation);
    bounds.extend(bondhuLocation);
    mapRef.current.fitBounds(bounds);
  }, [taskLocation, bondhuLocation]);

  // Guard: don't render map if Google Maps script isn't loaded yet
  if (!window.google?.maps) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted rounded-lg text-muted-foreground">
        <p>Loading Google Maps...</p>
      </div>
    );
  }

  const center = bondhuLocation || taskLocation;

  // Safely create marker icon
  const taskMarkerIcon = window.google?.maps ? {
    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    scaledSize: new window.google.maps.Size(40, 40),
  } : undefined;

  return (
    <div className="space-y-4">
      {bondhuLocation && (distance || duration) && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                Distance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{distance || 'Calculating...'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                ETA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{duration || 'Calculating...'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="relative rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={14}
          onLoad={onLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {/* Task Location Marker */}
          <Marker
            position={taskLocation}
            icon={taskMarkerIcon}
            title="Task Location"
          />

          {/* Bondhu Location Marker - Animated Bicycle */}
          {bondhuLocation && (
            <AnimatedBicycleMarker
              position={bondhuLocation}
              name={bondhuName}
            />
          )}

          {/* Directions Route */}
          {directions && showDirections && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#3A8B24',
                  strokeWeight: 5,
                  strokeOpacity: 0.8,
                },
              }}
            />
          )}
        </GoogleMap>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs font-medium">Task Location</span>
          </div>
          {bondhuLocation && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3A8B24]"></div>
              <span className="text-xs font-medium">{bondhuName} 🚴</span>
            </div>
          )}
        </div>

        {/* Live Status Badge */}
        {bondhuLocation && (
          <div className="absolute top-4 right-4">
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              <span className="animate-pulse mr-1">●</span> Live Tracking
            </Badge>
          </div>
        )}
      </div>

      {taskAddress && (
        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Task Location</p>
            <p className="text-sm text-muted-foreground">{taskAddress}</p>
          </div>
        </div>
      )}
    </div>
  );
}
