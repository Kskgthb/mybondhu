import { LoadScript } from '@react-google-maps/api';
import { ReactNode } from 'react';
import { GOOGLE_MAPS_CONFIG, isGoogleMapsConfigured } from '@/lib/googleMapsConfig';

const libraries: ("places" | "geometry" | "drawing")[] = ['places', 'geometry'];

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  if (!isGoogleMapsConfigured()) {
    console.error('Google Maps API key is not configured');
    return <>{children}</>;
  }

  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_CONFIG.primaryKey}
      libraries={libraries}
      loadingElement={<div>Loading Maps...</div>}
    >
      {children}
    </LoadScript>
  );
}
