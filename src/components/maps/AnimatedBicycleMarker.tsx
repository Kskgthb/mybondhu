import { useEffect, useState } from 'react';
import { OverlayView } from '@react-google-maps/api';
import Lottie from 'lottie-react';

interface AnimatedBicycleMarkerProps {
  position: { lat: number; lng: number };
  name?: string;
}

export default function AnimatedBicycleMarker({ position, name = 'Bondhu' }: AnimatedBicycleMarkerProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    fetch('/bondhu-splash.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Failed to load lottie', err));
  }, []);

  if (!animationData || !window.google?.maps) {
    return null;
  }

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={() => ({
        x: -40,
        y: -40,
      })}
    >
      <div 
        style={{ 
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none'
        }}
      >
        <div style={{ width: 80, height: 80 }}>
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        {name && (
          <div className="bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-0.5 rounded shadow-sm border mt-[-15px] whitespace-nowrap">
            {name}
          </div>
        )}
      </div>
    </OverlayView>
  );
}
