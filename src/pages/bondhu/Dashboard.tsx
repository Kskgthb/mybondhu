import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { tasksApi, assignmentsApi, profilesApi, realtimeApi } from '@/db/api';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Power, MapPin, Loader2, Navigation } from 'lucide-react';
import TaskCard from '@/components/task/TaskCard';
import { Skeleton } from '@/components/ui/skeleton';
import TaskCardSkeleton from '@/components/common/TaskCardSkeleton';
import CompactBanner from '@/components/common/CompactBanner';

import NotificationDialog from '@/components/common/NotificationDialog';
import RoleSwitchButton from '@/components/common/RoleSwitchButton';
import type { TaskWithDistance, TaskWithAssignment } from '@/types/types';
import { toast } from 'sonner';
import { navigateToLocation } from '@/lib/googleMaps';
import { initializeNotifications, updateSWLocation } from '@/lib/notifications';
import { getClearedTasks, clearTask } from '@/lib/clearStorage';

export default function BondhuDashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const { currentRole } = useRole();
  const navigate = useNavigate();
  const [nearbyTasks, setNearbyTasks] = useState<TaskWithDistance[]>([]);
  const [myAssignments, setMyAssignments] = useState<TaskWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('nearby');
  const [isAvailable, setIsAvailable] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Notification states
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'task_accepted' | 'bondhu_arrived' | 'task_completed'>('task_accepted');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  // Load cached tasks on mount to show immediately
  useEffect(() => {
    // Try localStorage first, then sessionStorage as fallback
    let cachedTasks = localStorage.getItem('bondhu_nearby_tasks');
    if (!cachedTasks) {
      cachedTasks = sessionStorage.getItem('bondhu_nearby_tasks');
      console.log('📦 Trying sessionStorage fallback');
    }
    
    if (cachedTasks) {
      try {
        const parsed = JSON.parse(cachedTasks);
        // Only use cache if it's less than 30 minutes old (increased from 5 minutes)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          console.log('📦 Loading cached tasks:', parsed.tasks.length, 'tasks');
          setNearbyTasks(parsed.tasks);
          setLoading(false); // Stop loading spinner since we have cached data
        } else {
          console.log('⏰ Cache expired, will load fresh data');
        }
      } catch (error) {
        console.error('❌ Error loading cached tasks:', error);
      }
    } else {
      console.log('📭 No cached tasks found');
    }
  }, []);

  // Initialize notifications on mount
  useEffect(() => {
    initializeNotifications();
  }, []);

  useEffect(() => {
    // Wait for profile to load before checking role
    if (!profile) {
      console.log('⏳ Waiting for profile to load...');
      return;
    }

    console.log('👤 Profile loaded:', { role: profile.role, active_role: profile.active_role, registration_completed: profile.registration_completed });

    // Don't redirect based on active_role - allow users to access both dashboards
    // The active_role is only used for the default dashboard selection

    if (profile) {
      setIsAvailable(profile.availability_status);
    }

    // Request location first
    requestLocation();
  }, [profile, navigate]);

  // Load data when user and location are ready
  useEffect(() => {
    if (!user) return;
    
    // Delay initial load slightly to allow cached tasks to render first
    const initialLoadTimer = setTimeout(() => {
      loadData();
    }, 100); // 100ms delay to show cached tasks first

    // Set up polling as fallback (every 10 seconds - less aggressive)
    const pollingInterval = setInterval(() => {
      console.log('🔄 Polling for task updates...');
      loadData();
    }, 10000);

    // Subscribe to both tasks and task_assignments for real-time updates
    const tasksChannel = realtimeApi.subscribeToTasks(() => {
      console.log('📡 Real-time: Tasks updated, reloading data...');
      loadData();
    });

    const assignmentsChannel = realtimeApi.subscribeToTaskAssignments(() => {
      console.log('📡 Real-time: Assignments updated, reloading data...');
      loadData();
    });

    return () => {
      clearTimeout(initialLoadTimer);
      clearInterval(pollingInterval);
      realtimeApi.unsubscribe(tasksChannel);
      realtimeApi.unsubscribe(assignmentsChannel);
    };
  }, [user, currentLocation]); // Re-run when location changes

  // Update location periodically to keep background proximity alerts accurate
  useEffect(() => {
    if (!user || !locationEnabled) return;

    // Check if user has any active tasks (accepted or in_progress)
    const hasActiveTasks = myAssignments.some(
      task => task.status === 'accepted' || task.status === 'in_progress'
    );

    // Update interval: 10s for active tasks, 30s when waiting for tasks
    const intervalMs = hasActiveTasks ? 10000 : 30000;

    const locationInterval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCurrentLocation(location);
            profilesApi.updateLocation(user.id, location.lat, location.lng);
            // Keep SW location in sync for background proximity alerts
            updateSWLocation(location.lat, location.lng);
          },
          (error) => {
            console.error('Location update error:', error);
          },
          { enableHighAccuracy: hasActiveTasks }
        );
      }
    }, intervalMs);

    return () => {
      clearInterval(locationInterval);
    };
  }, [user, locationEnabled, myAssignments]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(location);
        setLocationEnabled(true);
        
        if (user) {
          profilesApi.updateLocation(user.id, location.lat, location.lng);
        }
        // Send location to Service Worker for proximity-based notifications
        updateSWLocation(location.lat, location.lng);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Please enable location access to see nearby tasks');
        setLocationEnabled(false);
      }
    );
  };

  const loadData = async () => {
    if (!user) return;
    
    // Don't show loading spinner if we're just refreshing
    const isInitialLoad = nearbyTasks.length === 0 && myAssignments.length === 0;
    if (isInitialLoad) {
      setLoading(true);
    }
    
    try {
      // Retry logic for assignments
      let assignments: TaskWithAssignment[] = [];
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          assignments = await assignmentsApi.getMyAssignments(user.id);
          break;
        } catch (error) {
          console.error(`Attempt ${attempt}/3 failed to load assignments:`, error);
          if (attempt === 3) throw error;
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
      
      // Only update assignments if we got data
      if (assignments && assignments.length >= 0) {
        const clearedTasks = getClearedTasks();
        setMyAssignments(assignments.filter(t => !clearedTasks.includes(t.id)));
      }

      // Get all accepted task IDs to filter them out (exclude declined tasks)
      const { data: acceptedAssignments } = await supabase
        .from('task_assignments')
        .select('task_id, status')
        .in('status', ['accepted', 'in_progress', 'completed']);
      
      const acceptedTaskIds = new Set(
        acceptedAssignments?.map(a => a.task_id) || []
      );

      // Get tasks declined by current user to filter them out
      const { data: myDeclinedTasks } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('bondhu_id', user.id)
        .eq('status', 'declined');
      
      const declinedTaskIds = new Set(
        myDeclinedTasks?.map(a => a.task_id) || []
      );

      if (currentLocation) {
        // If location is available, get nearby tasks with distance
        let nearby: TaskWithDistance[] = [];
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            nearby = await tasksApi.getNearbyTasks(currentLocation.lat, currentLocation.lng, 50);
            break;
          } catch (error) {
            console.error(`Attempt ${attempt}/3 failed to load nearby tasks:`, error);
            if (attempt === 3) {
              // On final failure, keep existing tasks instead of clearing them
              console.warn('⚠️ Failed to load nearby tasks after 3 attempts, keeping existing tasks');
              return; // Exit without updating state
            }
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          }
        }
        
        // Filter out tasks that are already accepted by any Bondhu OR declined by current user
        const availableTasks = nearby.filter(task => 
          task.status === 'pending' && 
          !acceptedTaskIds.has(task.id) &&
          !declinedTaskIds.has(task.id)
        );
        
        // Only update if we have tasks or if this is initial load
        if (availableTasks.length > 0 || isInitialLoad) {
          console.log('✅ Updating nearby tasks:', availableTasks.length, 'tasks');
          setNearbyTasks(availableTasks);
          // Cache tasks for persistence across refreshes (dual storage for reliability)
          const cacheData = JSON.stringify({
            tasks: availableTasks,
            timestamp: Date.now()
          });
          try {
            localStorage.setItem('bondhu_nearby_tasks', cacheData);
            sessionStorage.setItem('bondhu_nearby_tasks', cacheData);
            console.log('💾 Tasks cached successfully');
          } catch (error) {
            console.error('❌ Error caching tasks:', error);
          }
        } else if (nearbyTasks.length > 0) {
          // Keep existing tasks if new query returns empty but we had tasks before
          console.log('📌 Keeping existing tasks, new query returned empty');
        }
      } else {
        // If location is not available, show ALL pending tasks (without distance)
        const { data: allTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        // Filter out tasks that are already accepted OR declined by current user
        const availableTasks = (allTasks || []).filter(task => 
          !acceptedTaskIds.has(task.id) &&
          !declinedTaskIds.has(task.id)
        );
        
        // Add distance_km as null for tasks without location
        const tasksWithDistance = availableTasks.map(task => ({
          ...task,
          distance_km: null
        }));
        
        // Only update if we have tasks or if this is initial load
        if (tasksWithDistance.length > 0 || isInitialLoad) {
          console.log('✅ Updating nearby tasks (no location):', tasksWithDistance.length, 'tasks');
          setNearbyTasks(tasksWithDistance as TaskWithDistance[]);
          // Cache tasks for persistence across refreshes (dual storage for reliability)
          const cacheData = JSON.stringify({
            tasks: tasksWithDistance,
            timestamp: Date.now()
          });
          try {
            localStorage.setItem('bondhu_nearby_tasks', cacheData);
            sessionStorage.setItem('bondhu_nearby_tasks', cacheData);
            console.log('💾 Tasks cached successfully');
          } catch (error) {
            console.error('❌ Error caching tasks:', error);
          }
        } else if (nearbyTasks.length > 0) {
          // Keep existing tasks if new query returns empty but we had tasks before
          console.log('📌 Keeping existing tasks, new query returned empty');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Only show error toast on initial load, not on background refreshes
      if (isInitialLoad) {
        toast.error('Failed to load tasks. Retrying...');
      }
      // Don't clear existing tasks on error - keep them visible
      console.log('📌 Keeping existing tasks due to error');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const handleAvailabilityToggle = async (checked: boolean) => {
    if (!user) return;
    
    try {
      await profilesApi.updateAvailability(user.id, checked);
      setIsAvailable(checked);
      await refreshProfile();
      
      // Force reload tasks when toggling availability
      await loadData();
      
      toast.success(checked ? 'You are now available for tasks' : 'You are now offline');
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleAcceptTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      console.log('🎯 Accepting task:', taskId);
      const result = await assignmentsApi.acceptTask(taskId, user.id);
      if (result.success) {
        toast.success('Task accepted successfully!', {
          description: 'You can now start working on this task.',
          duration: 3000,
        });
        
        // Smart Notification System: Track strong interest (weight +0.2)
        const acceptedTask = nearbyTasks.find(t => t.id === taskId);
        if (acceptedTask && acceptedTask.category) {
          tasksApi.trackInteraction(user.id, acceptedTask.category, 0.2);
        }
        
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Error accepting task:', error);
      toast.error(error.message || 'Failed to accept task');
    }
  };

  const handleDeclineTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      const result = await assignmentsApi.declineTask(taskId, user.id);
      if (result.success) {
        toast.success('Task declined');
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Error declining task:', error);
      toast.error(error.message || 'Failed to decline task');
    }
  };

  const handleViewTask = (taskId: string) => {
    navigate(`/task/${taskId}`);
  };

  const handleNavigateToTask = (taskId: string) => {
    const task = myAssignments.find(t => t.id === taskId);
    if (task && task.location_lat && task.location_lng) {
      navigateToLocation({
        latitude: task.location_lat,
        longitude: task.location_lng,
        address: task.location_address || undefined
      });
      toast.success('Opening Google Maps for navigation');
    } else {
      toast.error('Location not available for this task');
    }
  };

  const filterAssignments = (status?: string) => {
    if (!status || status === 'all') return myAssignments;
    if (status === 'in_progress') {
      return myAssignments.filter(t => t.status === 'in_progress' || t.status === 'accepted');
    }
    return myAssignments.filter(t => t.status === status);
  };

  const getAssignmentCount = (status?: string) => {
    return filterAssignments(status).length;
  };

  return (
    <div className="relative min-h-screen">

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Bondhu Dashboard</h1>
              <p className="text-muted-foreground">
                Find nearby tasks and manage your assignments
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Availability and Role Switch are now in the Top Header */}
            </div>
          </div>
        </div>

        {/* Compact Banner */}
        <CompactBanner />

        {!locationEnabled && (
          <Card className="border-warning bg-warning/10">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Access Required
              </CardTitle>
              <CardDescription>
                Please enable location access to see nearby tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={requestLocation} variant="outline" size="sm">
                Enable Location
              </Button>
            </CardContent>
          </Card>
        )}



      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <TabsList className="inline-flex w-auto min-w-full md:min-w-0 h-auto p-1 gap-1">
            <TabsTrigger 
              value="nearby" 
              className="flex-shrink-0 text-xs sm:text-sm px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="hidden sm:inline">Nearby Tasks</span>
              <span className="sm:hidden">Nearby</span>
              <span className="ml-1">({nearbyTasks.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              className="flex-shrink-0 text-xs sm:text-sm px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="hidden sm:inline">My Tasks</span>
              <span className="sm:hidden">My</span>
              <span className="ml-1">({getAssignmentCount()})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="in_progress" 
              className="flex-shrink-0 text-xs sm:text-sm px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="hidden sm:inline">In Progress</span>
              <span className="sm:hidden">Progress</span>
              <span className="ml-1">({getAssignmentCount('in_progress')})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="flex-shrink-0 text-xs sm:text-sm px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="hidden sm:inline">Completed</span>
              <span className="sm:hidden">Done</span>
              <span className="ml-1">({getAssignmentCount('completed')})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="nearby" className="space-y-4">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <TaskCardSkeleton key={i} />
              ))}
            </div>
          ) : nearbyTasks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No tasks available at the moment</p>
              {!locationEnabled && (
                <p className="text-sm text-muted-foreground mt-2">
                  Enable location to see distance information
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {nearbyTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showDistance={locationEnabled}
                  showActions
                  onAccept={() => handleAcceptTask(task.id)}
                  onDecline={() => handleDeclineTask(task.id)}
                  onView={() => handleViewTask(task.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4].map(i => (
                <TaskCardSkeleton key={i} />
              ))}
            </div>
          ) : myAssignments.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">You haven't accepted any tasks yet</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myAssignments.map(task => {
                const isActive = task.status === 'accepted' || task.status === 'in_progress';
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onView={() => handleViewTask(task.id)}
                    showNavigate={isActive}
                    onNavigate={isActive ? () => handleNavigateToTask(task.id) : undefined}
                    onClear={() => { clearTask(task.id); loadData(); }}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <TaskCardSkeleton key={i} />
              ))}
            </div>
          ) : filterAssignments('in_progress').length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No tasks in progress</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterAssignments('in_progress').map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={() => handleViewTask(task.id)}
                  showNavigate={true}
                  onNavigate={() => handleNavigateToTask(task.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <TaskCardSkeleton key={i} />
              ))}
            </div>
          ) : filterAssignments('completed').length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No completed tasks</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterAssignments('completed').map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={() => handleViewTask(task.id)}
                  onClear={() => { clearTask(task.id); loadData(); }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
      
      {/* Notification Dialog */}
      <NotificationDialog
        open={showNotification}
        onOpenChange={setShowNotification}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
      />
    </div>
  );
}
