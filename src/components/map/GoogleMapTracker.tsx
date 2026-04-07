import * as React from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Navigation } from 'lucide-react';

interface GoogleMapTrackerProps {
  bondhuLocation: { lat: number; lng: number };
  taskLocation: { lat: number; lng: number };
  bondhuName?: string;
  taskAddress?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.5rem',
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090, // Delhi, India
};

export default function GoogleMapTracker({
  bondhuLocation,
  taskLocation,
  bondhuName = 'Bondhu',
  taskAddress = 'Task Location',
}: GoogleMapTrackerProps) {
  const [directions, setDirections] = React.useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = React.useState<string>('');
  const [duration, setDuration] = React.useState<string>('');
  const [mapError, setMapError] = React.useState<string>('');

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Calculate center point between bondhu and task
  const center = React.useMemo(() => {
    return {
      lat: (bondhuLocation.lat + taskLocation.lat) / 2,
      lng: (bondhuLocation.lng + taskLocation.lng) / 2,
    };
  }, [bondhuLocation, taskLocation]);

  // Calculate directions when locations change
  React.useEffect(() => {
    if (!window.google || !window.google.maps) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: bondhuLocation,
        destination: taskLocation,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          const route = result.routes[0];
          if (route && route.legs[0]) {
            setDistance(route.legs[0].distance?.text || '');
            setDuration(route.legs[0].duration?.text || '');
          }
        } else {
          console.error('Directions request failed:', status);
          setMapError('Unable to calculate route');
        }
      }
    );
  }, [bondhuLocation, taskLocation]);

  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return (
      <Card className="p-6">
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            Google Maps API key is not configured. Please add your API key to the .env file.
            <br />
            <span className="text-xs text-muted-foreground mt-2 block">
              Get your API key from: https://console.cloud.google.com/
            </span>
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {mapError && (
        <Alert variant="destructive">
          <AlertDescription>{mapError}</AlertDescription>
        </Alert>
      )}

      {distance && duration && (
        <Card className="p-4 bg-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">{distance}</p>
                <p className="text-sm text-muted-foreground">Distance</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{duration}</p>
              <p className="text-sm text-muted-foreground">Estimated Time</p>
            </div>
          </div>
        </Card>
      )}

      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {/* Bondhu Marker */}
          <Marker
            position={bondhuLocation}
            title={bondhuName}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(40, 40),
            }}
            label={{
              text: bondhuName,
              color: '#1e40af',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          />

          {/* Task Location Marker */}
          <Marker
            position={taskLocation}
            title={taskAddress}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(40, 40),
            }}
            label={{
              text: 'Task',
              color: '#dc2626',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          />

          {/* Directions Route */}
          {directions && (
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
      </LoadScript>
    </div>
  );
}
