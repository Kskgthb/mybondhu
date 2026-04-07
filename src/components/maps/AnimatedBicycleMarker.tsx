/**
 * Animated Bicycle Marker Component
 * Shows a bicycle icon with smooth animation on Google Maps
 */

import { useEffect, useRef } from 'react';
import { Marker } from '@react-google-maps/api';

interface AnimatedBicycleMarkerProps {
  position: { lat: number; lng: number };
  name?: string;
}

export default function AnimatedBicycleMarker({ position, name = 'Bondhu' }: AnimatedBicycleMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Create custom bicycle SVG icon
  const bicycleIcon = {
    path: 'M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z',
    fillColor: '#3A8B24',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 1.2,
    anchor: new google.maps.Point(12, 12),
  };

  return (
    <Marker
      position={position}
      icon={bicycleIcon}
      title={`${name} - On the way`}
      animation={google.maps.Animation.DROP}
      onLoad={(marker) => {
        markerRef.current = marker;
        
        // Add pulsing animation effect
        const pulseAnimation = () => {
          if (marker) {
            const icon = marker.getIcon() as google.maps.Symbol;
            if (icon) {
              let scale = 1.2;
              let growing = true;
              
              setInterval(() => {
                if (growing) {
                  scale += 0.05;
                  if (scale >= 1.4) growing = false;
                } else {
                  scale -= 0.05;
                  if (scale <= 1.2) growing = true;
                }
                
                marker.setIcon({
                  ...icon,
                  scale: scale,
                });
              }, 100);
            }
          }
        };
        
        // Start pulse animation after a short delay
        setTimeout(pulseAnimation, 1000);
      }}
    />
  );
}
