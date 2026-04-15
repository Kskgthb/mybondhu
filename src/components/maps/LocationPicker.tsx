import { useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
  height?: string;
}

const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // Delhi, India

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

export default function LocationPicker({ 
  onLocationSelect, 
  initialLocation,
  height = '400px'
}: LocationPickerProps) {
  const [center, setCenter] = useState(initialLocation || defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(initialLocation || defaultCenter);
  const [address, setAddress] = useState('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newPosition = { lat, lng };
        
        setCenter(newPosition);
        setMarkerPosition(newPosition);
        setAddress(place.formatted_address || '');
        
        onLocationSelect({
          lat,
          lng,
          address: place.formatted_address || ''
        });
      }
    }
  }, [onLocationSelect]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!window.google?.maps || !e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const newPosition = { lat, lng };
    
    setMarkerPosition(newPosition);
    
    // Reverse geocode to get address
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: newPosition }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const formattedAddress = results[0].formatted_address;
        setAddress(formattedAddress);
        onLocationSelect({
          lat,
          lng,
          address: formattedAddress
        });
      }
    });
  }, [onLocationSelect]);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!window.google?.maps) return;
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newPosition = { lat, lng };
          
          setCenter(newPosition);
          setMarkerPosition(newPosition);
          
          // Reverse geocode to get address
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: newPosition }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const formattedAddress = results[0].formatted_address;
              setAddress(formattedAddress);
              onLocationSelect({
                lat,
                lng,
                address: formattedAddress
              });
              toast.success('Current location detected');
            }
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get current location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  }, [onLocationSelect]);

  // Guard: don't render map if Google Maps script isn't loaded yet
  if (!window.google?.maps) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg text-muted-foreground">
        <p>Loading Google Maps...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Autocomplete
          onLoad={onAutocompleteLoad}
          onPlaceChanged={onPlaceChanged}
          className="flex-1"
        >
          <Input
            type="text"
            placeholder="Search for a location..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full"
          />
        </Autocomplete>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={getCurrentLocation}
          title="Use current location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={{ ...mapContainerStyle, height }}
          center={center}
          zoom={15}
          onClick={onMapClick}
          onLoad={onLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          <Marker
            position={markerPosition}
            draggable={true}
            onDragEnd={(e) => {
              if (!window.google?.maps || !e.latLng) return;
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              const newPosition = { lat, lng };
              
              setMarkerPosition(newPosition);
              
              // Reverse geocode to get address
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({ location: newPosition }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  const formattedAddress = results[0].formatted_address;
                  setAddress(formattedAddress);
                  onLocationSelect({
                    lat,
                    lng,
                    address: formattedAddress
                  });
                }
              });
            }}
          />
        </GoogleMap>
      </div>

      {address && (
        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Selected Location</p>
            <p className="text-sm text-muted-foreground">{address}</p>
          </div>
        </div>
      )}
    </div>
  );
}
