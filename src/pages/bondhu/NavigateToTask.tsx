/**
 * Bondhu Navigate to Task Page
 * Provides turn-by-turn navigation for Bondhu to reach task location
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BondhuNavigationMap } from '@/components/maps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Phone, MessageCircle, CheckCircle, Navigation as NavigationIcon, Zap, Bike, MapPin } from 'lucide-react';
import { tasksApi, assignmentsApi, profilesApi } from '@/db/api';
import { insertBondhuLocation } from '@/db/locationApi';
import { getCurrentLocation, watchLocation, clearLocationWatch, calculateDistance } from '@/lib/mapUtils';
import { toast } from 'sonner';
import type { Task, TaskAssignment, Profile } from '@/types/types';
import ChatDialog from '@/components/task/ChatDialog';
import TaskCompletionWorkflow from '@/components/task/TaskCompletionWorkflow';

export default function NavigateToTask() {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [assignment, setAssignment] = useState<TaskAssignment | null>(null);
  const [posterProfile, setPosterProfile] = useState<Profile | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (!taskId || !user) return;
    loadTaskData();
  }, [taskId, user]);

  // Start location tracking
  useEffect(() => {
    if (!task || !user || !taskId) return;

    // Get initial location
    getCurrentLocation().then((location) => {
      if (location) {
        setCurrentLocation(location);
        // Send initial location update
        insertBondhuLocation({
          bondhu_id: user.id,
          task_id: taskId,
          location_lat: location.lat,
          location_lng: location.lng,
        });
      }
    });

    // Watch location changes
    const id = watchLocation((location) => {
      setCurrentLocation(location);
      
      // Calculate distance to task
      if (task) {
        const dist = calculateDistance(
          location.lat,
          location.lng,
          task.location_lat,
          task.location_lng
        );
        setDistance(dist);
      }
      
      // Send location update to database
      insertBondhuLocation({
        bondhu_id: user.id,
        task_id: taskId,
        location_lat: location.lat,
        location_lng: location.lng,
      });
    });

    if (id) {
      setWatchId(id);
      setIsTracking(true);
      toast.success('Location tracking started');
    } else {
      toast.error('Unable to access location. Please enable location services.');
    }

    // Cleanup
    return () => {
      if (id) {
        clearLocationWatch(id);
        setIsTracking(false);
      }
    };
  }, [task, user, taskId]);

  const loadTaskData = async () => {
    if (!taskId || !user) return;

    try {
      setLoading(true);

      // Get task details
      const taskData = await tasksApi.getTask(taskId);
      if (!taskData) {
        toast.error('Task not found');
        navigate('/bondhu/dashboard');
        return;
      }

      // Verify this task is assigned to current user
      const myAssignment = await assignmentsApi.getAssignment(taskId, user.id);

      if (!myAssignment || (myAssignment.status !== 'accepted' && myAssignment.status !== 'in_progress' && myAssignment.status !== 'completed')) {
        toast.error('You are not assigned to this task');
        navigate('/bondhu/dashboard');
        return;
      }

      // If task is completed, show success and redirect to dashboard after a delay
      if (myAssignment.status === 'completed' && taskData.status === 'completed') {
        toast.success('Task completed successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/bondhu/dashboard');
        }, 2000);
        return;
      }

      setTask(taskData);
      setAssignment(myAssignment);

      // Debug: Log payment QR data
      console.log('📱 Task payment_qr_data:', taskData.payment_qr_data);
      console.log('💳 Payment method:', taskData.payment_method);
      console.log('✅ Code verified:', taskData.code_verified);

      // Fetch poster profile
      const poster = await profilesApi.getProfile(taskData.poster_id);
      if (poster) {
        setPosterProfile(poster);
      }
    } catch (error) {
      console.error('Error loading task data:', error);
      toast.error('Failed to load task information');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async () => {
    if (!taskId || !user) return;

    try {
      const result = await assignmentsApi.startTask(taskId, user.id);
      if (result.success) {
        toast.success('Task started!');
        setAssignment((prev) => (prev ? { ...prev, status: 'in_progress' } : null));
      } else {
        toast.error(result.message || 'Failed to start task');
      }
    } catch (error) {
      console.error('Error starting task:', error);
      toast.error('Failed to start task');
    }
  };

  const handleCompleteTask = async () => {
    if (!taskId || !user) return;

    try {
      const result = await assignmentsApi.completeTask(taskId, user.id);
      if (result.success) {
        toast.success('Task marked as complete!');
        navigate(`/task/${taskId}`);
      } else {
        toast.error(result.message || 'Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  const handlePaymentConfirm = async () => {
    if (!taskId) return;

    try {
      const result = await tasksApi.bondhuConfirmPaymentReceived(taskId);
      if (result.success) {
        toast.success('Payment confirmed! Task completed.');
        await loadTaskData(); // Reload to get updated status
      } else {
        toast.error(result.message || 'Failed to confirm payment');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    }
  };

  const openInGoogleMaps = () => {
    if (!task) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${task.location_lat},${task.location_lng}`;
    window.open(url, '_blank');
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

  if (!task || !assignment) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Task not found or not assigned to you</p>
            <Button onClick={() => navigate('/bondhu/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/bondhu/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Navigate to Task</h1>
            <p className="text-sm text-muted-foreground">Reach {posterProfile?.username || 'Task Poster'}</p>
          </div>
        </div>
        <Badge className={getStatusColor(assignment.status)}>
          {assignment.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Navigation Map with Status Overlay */}
      <div className="relative">
        <Card className="overflow-hidden">
          <CardContent className="p-0 relative">
            <BondhuNavigationMap
              taskLocation={{
                lat: task.location_lat,
                lng: task.location_lng,
              }}
              currentLocation={currentLocation}
              taskAddress={task.location_address}
            />
            
            {/* Delivery-Style Status Card Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <Card className="bg-background/95 backdrop-blur-md shadow-2xl border-2">
                <CardContent className="p-6">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="default" className="bg-primary text-primary-foreground px-3 py-1">
                      <Zap className="h-3 w-3 mr-1" />
                      {assignment.status === 'accepted' ? 'HEADING TO TASK' : 'SOLVING TASK'}
                    </Badge>
                    {distance !== null && distance < 0.5 && (
                      <Badge variant="secondary" className="bg-success text-white">
                        NEARBY
                      </Badge>
                    )}
                    {isTracking && (
                      <Badge variant="outline" className="border-success text-success">
                        <span className="animate-pulse mr-1">●</span> LIVE
                      </Badge>
                    )}
                  </div>

                  {/* Main Status Text */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold mb-2">
                      {assignment.status === 'accepted' ? 'On the way to solve the task' : 'Solving the task'}
                    </h3>
                    <p className="text-muted-foreground">
                      {assignment.status === 'accepted' 
                        ? `Navigate to ${posterProfile?.username || 'Task Poster'}'s location` 
                        : 'Complete the task and mark it as done'}
                    </p>
                  </div>

                  {/* ETA and Distance */}
                  {currentLocation && distance !== null && assignment.status === 'accepted' && (
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

                  {/* Task Location */}
                  <div className="flex items-start gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Task Location</p>
                      <p className="text-xs text-muted-foreground">{task.location_address}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    {assignment.status === 'accepted' && (
                      <Button
                        onClick={handleStartTask}
                        className="col-span-2"
                        size="lg"
                      >
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Arrived - Start Task
                      </Button>
                    )}
                    
                    <Button
                      onClick={openInGoogleMaps}
                      variant="outline"
                      size="sm"
                    >
                      <NavigationIcon className="mr-2 h-4 w-4" />
                      Google Maps
                    </Button>

                    <Button
                      onClick={() => setShowChatDialog(true)}
                      variant="outline"
                      size="sm"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat
                    </Button>

                    {posterProfile?.phone && (
                      <Button
                        onClick={() => window.open(`tel:${posterProfile.phone}`, '_self')}
                        variant="outline"
                        size="sm"
                        className="col-span-2"
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Call {posterProfile.username}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Information */}
      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
          <CardDescription>Task Details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="text-sm">{task.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-3 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-lg font-semibold text-primary">₹{task.amount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Urgency</p>
              <Badge variant="outline" className="mt-1">{task.urgency}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <Badge variant="secondary" className="mt-1">{task.category}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Completion Workflow - Only show when task is in progress */}
      {assignment.status === 'in_progress' && task && (
        <TaskCompletionWorkflow
          task={{
            ...task,
            assignment: assignment,
            bondhu: posterProfile,
          } as any}
          onComplete={loadTaskData}
          onPaymentConfirm={handlePaymentConfirm}
        />
      )}

      <ChatDialog
        open={showChatDialog}
        onOpenChange={setShowChatDialog}
        taskId={taskId!}
        otherUserName={posterProfile?.username || 'Task Poster'}
      />
    </div>
  );
}
