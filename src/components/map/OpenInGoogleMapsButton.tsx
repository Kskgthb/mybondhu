import { Button } from '@/components/ui/button';
import { Navigation, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface OpenInGoogleMapsButtonProps {
  destinationLat: number;
  destinationLng: number;
  destinationName: string;
  currentLat?: number;
  currentLng?: number;
}

export default function OpenInGoogleMapsButton({
  destinationLat,
  destinationLng,
  destinationName,
  currentLat,
  currentLng,
}: OpenInGoogleMapsButtonProps) {
  const handleOpenMaps = () => {
    // Create Google Maps URL with navigation
    let mapsUrl = '';
    
    if (currentLat && currentLng) {
      // If current location is available, create directions URL
      mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLng}&destination=${destinationLat},${destinationLng}&travelmode=driving`;
    } else {
      // Otherwise, just open the destination
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${destinationLat},${destinationLng}`;
    }

    // Open in new window (will open native app on mobile)
    window.open(mapsUrl, '_blank');
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 shadow-md">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Navigate to Task Location</p>
              <p className="text-xs text-muted-foreground truncate">{destinationName}</p>
            </div>
          </div>
          
          <Button
            onClick={handleOpenMaps}
            className="w-full h-12 text-base gap-2 bg-primary hover:bg-primary/90"
          >
            <img 
              src="https://www.google.com/images/branding/product/2x/maps_96in128dp.png" 
              alt="Google Maps"
              className="h-6 w-6"
            />
            Open in Google Maps
            <ExternalLink className="h-4 w-4" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Get turn-by-turn navigation with real-time traffic updates
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
