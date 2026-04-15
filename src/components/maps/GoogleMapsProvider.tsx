import { useJsApiLoader } from '@react-google-maps/api';
import { ReactNode, createContext, useContext, useRef } from 'react';
import { GOOGLE_MAPS_CONFIG, isGoogleMapsConfigured } from '@/lib/googleMapsConfig';

const libraries: ("places" | "geometry" | "drawing")[] = ['places', 'geometry'];

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
  isConfigured: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
  isConfigured: false,
});

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const configured = isGoogleMapsConfigured();
  const hasWarnedRef = useRef(false);

  // Always call the hook (React rules of hooks), but with empty key when not configured
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: configured ? GOOGLE_MAPS_CONFIG.primaryKey : '',
    libraries,
    // Prevent any loading when not configured
    ...(!configured ? { preventGoogleFontsLoading: true } : {}),
  });

  // Determine actual loaded state: only truly loaded if configured AND script loaded
  const actuallyLoaded = configured && isLoaded && !loadError && !!window.google?.maps;

  // Only warn once to prevent console spam
  if (!configured && import.meta.env.DEV && !hasWarnedRef.current) {
    hasWarnedRef.current = true;
    console.warn(
      'Google Maps API key is not configured. Set VITE_GOOGLE_MAPS_API_KEY in your .env file.'
    );
  }

  if (loadError && import.meta.env.DEV) {
    console.error('Google Maps failed to load:', loadError);
  }

  return (
    <GoogleMapsContext.Provider value={{
      isLoaded: actuallyLoaded,
      loadError,
      isConfigured: configured,
    }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
