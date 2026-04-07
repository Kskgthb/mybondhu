import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { tasksApi, assignmentsApi, profilesApi } from '@/db/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Navigation, Phone, Clock, User, ArrowLeft, RefreshCw, MessageCircle, Zap, Bike, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Task, Profile, TaskAssignment } from '@/types/types';
import { formatDistanceToNow } from 'date-fns';
import ChatDialog from '@/components/task/ChatDialog';
import { LiveTrackingMap } from '@/components/maps';
import { subscribeToBondhuLocation, subscribeToProfileLocation, unsubscribeFromLocation } from '@/db/locationApi';
import { calculateDistance } from '@/lib/mapUtils';

export default function TrackBondhu() {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [bondhu, setBondhu] = useState<Profile | null>(null);
  const [assignment, setAssignment] = useState<TaskAssignment | null>(null);
  const [bondhuLocation, setBondhuLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [showStatusCard, setShowStatusCard] = useState(true);

  useEffect(() => {
    if (!taskId) return;
    loadData();
  }, [taskId]);

  // Set up real-time location updates using new location tracking system
  useEffect(() => {
    if (!assignment?.bondhu_id || !taskId) return;

    // Subscribe to bondhu_locations table for real-time updates
    const locationChannel = subscribeToBondhuLocation(taskId, (location) => {
      setBondhuLocation({
        lat: location.location_lat,
        lng: location.location_lng,
      });
    });

    // Also subscribe to profile updates as fallback
    const profileChannel = subscribeToProfileLocation(assignment.bondhu_id, (profile) => {
      setBondhuLocation({
        lat: profile.location_lat,
        lng: profile.location_lng,
      });
    });

    // Refresh location every 10 seconds as backup
    const interval = setInterval(() => {
      refreshLocation();
    }, 10000);

    return () => {
      unsubscribeFromLocation(locationChannel);
      unsubscribeFromLocation(profileChannel);
      clearInterval(interval);
    };
  }, [assignment?.bondhu_id, taskId]);

  // Calculate distance when locations change
  useEffect(() => {
    if (task && bondhuLocation && task.location_lat && task.location_lng) {
      const dist = calculateDistance(
        bondhuLocation.lat,
        bondhuLocation.lng,
        task.location_lat,
        task.location_lng
      );
      setDistance(dist);
    }
  }, [task, bondhuLocation]);

  const loadData = async () => {
    if (!taskId) return;

    try {
      setLoading(true);

      // Get task details
      const taskData = await tasksApi.getTask(taskId);
      if (!taskData) {
        toast.error('Task not found');
        navigate('/need-bondhu/dashboard');
        return;
      }
      setTask(taskData);

      // Get assignment details
      const { data: assignmentData } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('task_id', taskId)
        .in('status', ['accepted', 'in_progress'])
        .maybeSingle();

      if (!assignmentData) {
        toast.error('No active Bondhu for this task');
        navigate(`/task/${taskId}`);
        return;
      }
      setAssignment(assignmentData);

      // Get Bondhu profile and location
      const bondhuProfile = await profilesApi.getProfile(assignmentData.bondhu_id);
      if (bondhuProfile) {
        setBondhu(bondhuProfile);
        if (bondhuProfile.location_lat && bondhuProfile.location_lng) {
          setBondhuLocation({
            lat: bondhuProfile.location_lat,
            lng: bondhuProfile.location_lng,
          });
        }
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
      toast.error('Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const refreshLocation = async () => {
    if (!assignment?.bondhu_id) return;

    try {
      setRefreshing(true);
      const bondhuProfile = await profilesApi.getProfile(assignment.bondhu_id);
      if (bondhuProfile?.location_lat && bondhuProfile.location_lng) {
        setBondhuLocation({
          lat: bondhuProfile.location_lat,
          lng: bondhuProfile.location_lng,
        });
      }
    } catch (error) {
      console.error('Error refreshing location:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!task || !bondhu || !assignment) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Tracking information not available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">Track Bondhu Live</h1>
        <p className="text-muted-foreground">Real-time location tracking</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Map Section with Status Overlay */}
        <div className="xl:col-span-2 relative">
          <Card className="overflow-hidden">
            <CardContent className="p-0 relative">
              <LiveTrackingMap
                taskLocation={{
                  lat: task.location_lat,
                  lng: task.location_lng,
                }}
                bondhuLocation={bondhuLocation || undefined}
                taskAddress={task.location_address}
                bondhuName={bondhu?.username || 'Bondhu'}
                showDirections={true}
              />
              
              {/* Delivery-Style Status Card Overlay */}
              {showStatusCard && (
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <Card className="bg-background/95 backdrop-blur-md shadow-2xl border-2">
                    <CardContent className="p-6">
                      {/* Close Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => setShowStatusCard(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="default" className="bg-primary text-primary-foreground px-3 py-1">
                          <Zap className="h-3 w-3 mr-1" />
                          {assignment.status === 'accepted' ? 'ON THE WAY' : 'IN PROGRESS'}
                        </Badge>
                        {distance !== null && distance < 0.5 && (
                          <Badge variant="secondary" className="bg-success text-white">
                            NEARBY
                          </Badge>
                        )}
                      </div>

                      {/* Main Status Text */}
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold mb-2">
                          {assignment.status === 'accepted' ? 'On the way to solve your task' : 'Working on your task'}
                        </h3>
                        <p className="text-muted-foreground">
                          <span className="font-semibold text-foreground">{bondhu.username || 'Bondhu'}</span> is {assignment.status === 'accepted' ? 'heading to your location' : 'solving your task'}
                        </p>
                      </div>

                      {/* ETA and Distance */}
                      {bondhuLocation && distance !== null && (
                        <div className="flex items-center justify-between mb-4 p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                              <Bike className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Estimated Time</p>
                              <p className="text-2xl font-bold text-primary">
                                {distance < 0.5 ? '< 2' : Math.ceil(distance * 3)} mins
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Distance</p>
                            <p className="text-lg font-semibold">{distance.toFixed(1)} km</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshLocation}
                          disabled={refreshing}
                          className="flex-1"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                        {bondhu.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1"
                          >
                            <a href={`tel:${bondhu.phone}`}>
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setShowChatDialog(true)}
                          className="flex-1"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Show Status Card Button (when hidden) */}
              {!showStatusCard && (
                <div className="absolute bottom-4 left-4 z-10">
                  <Button
                    onClick={() => setShowStatusCard(true)}
                    className="shadow-lg"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Show Status
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          {/* Bondhu Info */}
          <Card>
            <CardHeader>
              <CardTitle>Bondhu Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={bondhu.photo_url || undefined} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{bondhu.username || 'Bondhu'}</p>
                  {bondhu.phone && (
                    <a href={`tel:${bondhu.phone}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {bondhu.phone}
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={assignment.status === 'in_progress' ? 'default' : 'secondary'}>
                    {assignment.status.replace('_', ' ')}
                  </Badge>
                </div>
                {assignment.accepted_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Accepted:</span>
                    <span>{formatDistanceToNow(new Date(assignment.accepted_at), { addSuffix: true })}</span>
                  </div>
                )}
                {assignment.started_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Started:</span>
                    <span>{formatDistanceToNow(new Date(assignment.started_at), { addSuffix: true })}</span>
                  </div>
                )}
              </div>

              {bondhu.location_updated_at && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Location updated {formatDistanceToNow(new Date(bondhu.location_updated_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Info */}
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">{task.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <a
                  href={`https://www.google.com/maps?q=${task.location_lat},${task.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {task.location_address}
                </a>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="font-semibold text-primary">₹{task.amount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ChatDialog
        open={showChatDialog}
        onOpenChange={setShowChatDialog}
        taskId={taskId!}
        otherUserName={bondhu.username || 'Bondhu'}
      />
    </div>
  );
}
