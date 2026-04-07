/**
 * Task Tracking Page
 * Real-time tracking of Bondhu location during task execution
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LiveTrackingMap } from '@/components/maps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, User, Phone, Clock, Navigation } from 'lucide-react';
import { 
  getActiveTaskTracking, 
  subscribeToBondhuLocation,
  subscribeToProfileLocation,
  unsubscribeFromLocation 
} from '@/db/locationApi';
import { calculateDistance } from '@/lib/mapUtils';
import { toast } from '@/hooks/use-toast';

export default function TaskTracking() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [taskData, setTaskData] = useState<any>(null);
  const [bondhuLocation, setBondhuLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!taskId) {
      toast({
        title: 'Error',
        description: 'Task ID is missing',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    loadTaskData();
  }, [taskId]);

  useEffect(() => {
    if (!taskData || !taskData.bondhu_id) return;

    // Subscribe to Bondhu location updates
    const locationChannel = subscribeToBondhuLocation(taskId!, (location) => {
      setBondhuLocation({
        lat: location.location_lat,
        lng: location.location_lng,
      });
      setLastUpdate(new Date());
    });

    // Subscribe to profile location updates (fallback)
    const profileChannel = subscribeToProfileLocation(taskData.bondhu_id, (profile) => {
      setBondhuLocation({
        lat: profile.location_lat,
        lng: profile.location_lng,
      });
      setLastUpdate(new Date(profile.location_updated_at));
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeFromLocation(locationChannel);
      unsubscribeFromLocation(profileChannel);
    };
  }, [taskData, taskId]);

  useEffect(() => {
    // Calculate distance when locations change
    if (taskData && bondhuLocation && taskData.task_lat && taskData.task_lng) {
      const dist = calculateDistance(
        bondhuLocation.lat,
        bondhuLocation.lng,
        Number(taskData.task_lat),
        Number(taskData.task_lng)
      );
      setDistance(dist);
    }
  }, [taskData, bondhuLocation]);

  const loadTaskData = async () => {
    try {
      setLoading(true);
      const data = await getActiveTaskTracking(taskId!);

      if (!data) {
        toast({
          title: 'Task Not Found',
          description: 'This task is not currently being tracked.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setTaskData(data);

      // Set initial Bondhu location if available
      if (data.bondhu_lat && data.bondhu_lng) {
        setBondhuLocation({
          lat: Number(data.bondhu_lat),
          lng: Number(data.bondhu_lng),
        });
        setLastUpdate(new Date(data.bondhu_location_updated));
      }
    } catch (error) {
      console.error('Error loading task data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load task tracking data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} minutes ago`;
    return `${Math.floor(diffSecs / 3600)} hours ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-info';
      case 'in_progress':
        return 'bg-success';
      case 'completed':
        return 'bg-muted';
      default:
        return 'bg-accent';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="bg-muted h-12 w-48" />
        <Skeleton className="bg-muted h-96 w-full" />
        <Skeleton className="bg-muted h-32 w-full" />
      </div>
    );
  }

  if (!taskData) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Task not found or not being tracked</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const taskLocation = {
    lat: Number(taskData.task_lat),
    lng: Number(taskData.task_lng),
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{taskData.task_title}</h1>
          <p className="text-sm text-muted-foreground">Real-time Tracking</p>
        </div>
        <Badge className={getStatusColor(taskData.assignment_status)}>
          {taskData.assignment_status}
        </Badge>
      </div>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <LiveTrackingMap
            taskLocation={taskLocation}
            bondhuLocation={bondhuLocation || undefined}
            taskAddress={taskData.task_address}
            bondhuName={taskData.bondhu_name}
            showDirections={true}
          />
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bondhu Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Bondhu Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Name:</span>
              <span className="font-medium">{taskData.bondhu_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Phone:</span>
              <a 
                href={`tel:${taskData.bondhu_phone}`}
                className="font-medium text-primary hover:underline flex items-center gap-1"
              >
                <Phone className="h-4 w-4" />
                {taskData.bondhu_phone}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant="outline">{taskData.assignment_status}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Location Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Distance:</span>
              <span className="font-medium">
                {distance !== null ? `${distance.toFixed(2)} km` : 'Calculating...'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Update:</span>
              <span className="font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatLastUpdate()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Destination:</span>
              <span className="font-medium flex items-center gap-1 text-right">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{taskData.task_address}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Tracking is active. Location updates every 5 seconds.
              </p>
            </div>
            <Button onClick={loadTaskData} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
