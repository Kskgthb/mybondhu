import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Clock } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  location: {
    lat: number;
    lng: number;
  };
  address?: string;
  amount?: number;
  urgency?: string;
  category?: string;
  distance?: number;
}

interface NearbyTasksMapProps {
  tasks: Task[];
  currentLocation?: { lat: number; lng: number };
  onTaskClick?: (taskId: string) => void;
  searchRadius?: number; // in meters
}

const mapContainerStyle = {
  width: '100%',
  height: '600px'
};

const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // Delhi, India

export default function NearbyTasksMap({
  tasks,
  currentLocation,
  onTaskClick,
  searchRadius = 5000 // 5km default
}: NearbyTasksMapProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Fit bounds to show all tasks
  useEffect(() => {
    if (mapRef.current && tasks.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      if (currentLocation) {
        bounds.extend(currentLocation);
      }
      
      tasks.forEach(task => {
        bounds.extend(task.location);
      });
      
      mapRef.current.fitBounds(bounds);
    }
  }, [tasks, currentLocation]);

  const getMarkerIcon = (urgency?: string) => {
    let color = 'yellow'; // default
    
    if (urgency === 'urgent') {
      color = 'red';
    } else if (urgency === 'high') {
      color = 'orange';
    } else if (urgency === 'normal') {
      color = 'green';
    }
    
    return {
      url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
      scaledSize: new google.maps.Size(40, 40),
    };
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-destructive';
      case 'high':
        return 'bg-warning';
      case 'normal':
        return 'bg-success';
      default:
        return 'bg-accent';
    }
  };

  const center = currentLocation || (tasks.length > 0 ? tasks[0].location : defaultCenter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} nearby
          </span>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-destructive"></div>
            <span>Urgent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span>Normal</span>
          </div>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          onLoad={onLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {/* Current Location Marker */}
          {currentLocation && (
            <>
              <Marker
                position={currentLocation}
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                  scaledSize: new google.maps.Size(50, 50),
                }}
                title="Your Location"
              />
              
              {/* Search Radius Circle */}
              <Circle
                center={currentLocation}
                radius={searchRadius}
                options={{
                  fillColor: '#3A8B24',
                  fillOpacity: 0.1,
                  strokeColor: '#3A8B24',
                  strokeOpacity: 0.3,
                  strokeWeight: 2,
                }}
              />
            </>
          )}

          {/* Task Markers */}
          {tasks.map((task) => (
            <Marker
              key={task.id}
              position={task.location}
              icon={getMarkerIcon(task.urgency)}
              onClick={() => setSelectedTask(task)}
              title={task.title}
            />
          ))}

          {/* Info Window for Selected Task */}
          {selectedTask && (
            <InfoWindow
              position={selectedTask.location}
              onCloseClick={() => setSelectedTask(null)}
            >
              <div className="p-2 max-w-xs">
                <h3 className="font-semibold text-sm mb-2">{selectedTask.title}</h3>
                
                <div className="space-y-2">
                  {selectedTask.category && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedTask.category}
                    </Badge>
                  )}
                  
                  {selectedTask.urgency && (
                    <Badge className={`text-xs ${getUrgencyColor(selectedTask.urgency)}`}>
                      {selectedTask.urgency}
                    </Badge>
                  )}
                  
                  {selectedTask.amount && (
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium">₹{selectedTask.amount}</span>
                    </div>
                  )}
                  
                  {selectedTask.distance && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{selectedTask.distance.toFixed(1)} km away</span>
                    </div>
                  )}
                  
                  {selectedTask.address && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {selectedTask.address}
                    </p>
                  )}
                </div>
                
                {onTaskClick && (
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => {
                      onTaskClick(selectedTask.id);
                      setSelectedTask(null);
                    }}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Current Location Badge */}
        {currentLocation && (
          <div className="absolute top-4 left-4">
            <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
              <MapPin className="h-3 w-3 mr-1" />
              Your Location
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
