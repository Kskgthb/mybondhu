import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { tasksApi, realtimeApi } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import TaskCard from '@/components/task/TaskCard';
import TaskPostDialog from '@/components/task/TaskPostDialog';
import TaskEditDialog from '@/components/task/TaskEditDialog';
import CancelTaskDialog from '@/components/task/CancelTaskDialog';
import RatingDialog from '@/components/task/RatingDialog';
import { Skeleton } from '@/components/ui/skeleton';
import TaskCardSkeleton from '@/components/common/TaskCardSkeleton';
import CompactBanner from '@/components/common/CompactBanner';
import CampusBackground from '@/components/common/CampusBackground';
import NotificationDialog from '@/components/common/NotificationDialog';
import RoleSwitchButton from '@/components/common/RoleSwitchButton';
import type { Task, TaskWithFullInfo } from '@/types/types';
import { toast } from 'sonner';
import { initializeNotifications } from '@/lib/notifications';
import { showPushNotification } from '@/services/notificationService';
import ProfileHeader from '@/components/dashboard/ProfileHeader';
import ReferralSection from '@/components/dashboard/ReferralSection';
import StatsSection from '@/components/dashboard/StatsSection';
import CoinsSection from '@/components/dashboard/CoinsSection';
import { Card, CardContent } from '@/components/ui/card';

export default function NeedBondhuDashboard() {
  const { user, profile } = useAuth();
  const { currentRole } = useRole();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskWithFullInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellingTask, setCancellingTask] = useState<Task | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingTask, setRatingTask] = useState<Task | null>(null);
  
  // Notification states
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'task_accepted' | 'bondhu_arrived' | 'task_completed'>('task_accepted');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTaskId, setNotificationTaskId] = useState<string | null>(null);

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

    console.log('👤 Profile loaded:', { role: profile.role, active_role: profile.active_role });

    // Don't redirect based on active_role - allow users to access both dashboards
    // The active_role is only used for the default dashboard selection
    
    loadTasks();
    
    // Set up polling as fallback (every 10 seconds - less aggressive)
    const pollingInterval = setInterval(() => {
      console.log('🔄 Polling for task updates...');
      loadTasks();
    }, 10000);
    
    // Subscribe to both tasks and task_assignments for real-time updates
    const tasksChannel = realtimeApi.subscribeToTasks(() => {
      console.log('📡 Real-time: Tasks updated, reloading...');
      loadTasks();
    });

    const assignmentsChannel = realtimeApi.subscribeToTaskAssignments(() => {
      console.log('📡 Real-time: Assignments updated, reloading...');
      loadTasks();
    });

    return () => {
      clearInterval(pollingInterval);
      realtimeApi.unsubscribe(tasksChannel);
      realtimeApi.unsubscribe(assignmentsChannel);
    };
  }, [profile, navigate]);

  const loadTasks = async () => {
    if (!user) return;
    
    // Don't show loading spinner if we're just refreshing
    const isInitialLoad = tasks.length === 0;
    if (isInitialLoad) {
      setLoading(true);
    }
    
    try {
      const previousTasks = [...tasks];
      
      // Retry logic for loading tasks
      let data: TaskWithFullInfo[] = [];
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          data = await tasksApi.getMyTasks(user.id);
          break;
        } catch (error) {
          console.error(`Attempt ${attempt}/3 failed to load tasks:`, error);
          if (attempt === 3) throw error;
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
      
      setTasks(data);
      
      // Check for status changes and show notifications
      if (previousTasks.length > 0) {
        data.forEach(newTask => {
          const oldTask = previousTasks.find(t => t.id === newTask.id);
          
          // Task was accepted
          if (oldTask && oldTask.status === 'pending' && newTask.status === 'accepted') {
            setNotificationType('task_accepted');
            setNotificationTitle('🎉 Task Accepted!');
            setNotificationMessage('A Bondhu has accepted your task and is on the way!');
            setNotificationTaskId(newTask.id);
            setShowNotification(true);
            // Also fire a SW push notification (works in background)
            showPushNotification('task_accepted', { taskId: newTask.id, taskTitle: newTask.title });
          }
          
          // Bondhu arrived (task moved to in_progress)
          if (oldTask && oldTask.status === 'accepted' && newTask.status === 'in_progress') {
            setNotificationType('bondhu_arrived');
            setNotificationTitle('📍 Bondhu Arrived!');
            setNotificationMessage('Your Bondhu has reached the location and started working!');
            setNotificationTaskId(newTask.id);
            setShowNotification(true);
            showPushNotification('bondhu_arrived', { taskId: newTask.id, taskTitle: newTask.title });
          }
          
          // Task completed
          if (oldTask && oldTask.status === 'in_progress' && newTask.status === 'completed') {
            setNotificationType('task_completed');
            setNotificationTitle('✅ Task Completed!');
            setNotificationMessage('The task has been successfully completed! Please rate your Bondhu.');
            setNotificationTaskId(newTask.id);
            setShowNotification(true);
            showPushNotification('task_completed', { taskId: newTask.id, taskTitle: newTask.title });
          }
        });
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      // Only show error toast on initial load, not on background refreshes
      if (isInitialLoad) {
        toast.error('Failed to load tasks. Retrying...');
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const filterTasks = (status?: string) => {
    if (!status || status === 'all') return tasks;
    return tasks.filter(task => task.status === status);
  };

  const handleViewTask = (taskId: string) => {
    navigate(`/task/${taskId}`);
  };

  const handleTaskPosted = () => {
    setShowPostDialog(false);
    loadTasks();
    toast.success('Task posted successfully!');
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditDialog(true);
  };

  const handleTaskUpdated = () => {
    setShowEditDialog(false);
    setEditingTask(null);
    loadTasks();
  };

  const handleCancelTask = (task: Task) => {
    setCancellingTask(task);
    setShowCancelDialog(true);
  };

  const handleCancelSuccess = () => {
    setShowCancelDialog(false);
    setCancellingTask(null);
    loadTasks();
    toast.success('Task cancelled successfully');
  };

  const handleRateTask = (task: Task) => {
    setRatingTask(task);
    setShowRatingDialog(true);
  };

  const handleRatingSuccess = () => {
    loadTasks();
    setRatingTask(null);
  };

  const getTaskCount = (status?: string) => {
    return filterTasks(status).length;
  };

  return (
    <div className="relative min-h-screen">
      <CampusBackground />
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Tasks</h1>
              <p className="text-muted-foreground">
                Manage your posted tasks and track their progress
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RoleSwitchButton variant="outline" size="default" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 mb-8">
          <ProfileHeader profile={profile} role="need_bondhu" />
          
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <StatsSection 
                rating={profile?.rating_avg || 0} 
                completed={getTaskCount('completed')} 
                pending={getTaskCount('in_progress') + getTaskCount('accepted')} 
                declined={getTaskCount('cancelled')} 
              />
              <Card className="bg-primary/5 border-none shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-1">Post your need, Bondhu will help 🤝</h3>
                  <p className="text-sm text-muted-foreground">Find helpers on campus for any task, big or small.</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <CoinsSection coins={profile?.bondhu_coins || 0} />
              <ReferralSection referralCode={profile?.referral_code || null} />
            </div>
          </div>
        </div>

      {/* Compact Banner */}
      <CompactBanner />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <TabsList className="inline-flex w-auto min-w-full md:min-w-0 h-auto p-1 gap-1">
            <TabsTrigger 
              value="all" 
              className="flex-shrink-0 text-xs sm:text-sm px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="hidden sm:inline">All</span>
              <span className="sm:hidden">All</span>
              <span className="ml-1">({getTaskCount()})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pending" 
              className="flex-shrink-0 text-xs sm:text-sm px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="hidden sm:inline">Pending</span>
              <span className="sm:hidden">Pending</span>
              <span className="ml-1">({getTaskCount('pending')})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="in_progress" 
              className="flex-shrink-0 text-xs sm:text-sm px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="hidden sm:inline">In Progress</span>
              <span className="sm:hidden">Progress</span>
              <span className="ml-1">({getTaskCount('in_progress')} + {getTaskCount('accepted')})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="flex-shrink-0 text-xs sm:text-sm px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="hidden sm:inline">Completed</span>
              <span className="sm:hidden">Done</span>
              <span className="ml-1">({getTaskCount('completed')})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
              {[1, 2, 3].map(i => (
                <TaskCardSkeleton key={i} />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">You haven't posted any tasks yet</p>
              <Button onClick={() => setShowPostDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Post Your First Task
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={() => handleViewTask(task.id)}
                  onEdit={() => handleEditTask(task)}
                  onCancel={() => handleCancelTask(task)}
                  onRate={task.status === 'completed' && !task.rating ? () => handleRateTask(task) : undefined}
                  showEdit={true}
                  showCancel={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
              {[1, 2].map(i => (
                <TaskCardSkeleton key={i} />
              ))}
            </div>
          ) : filterTasks('pending').length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No pending tasks</p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
              {filterTasks('pending').map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={() => handleViewTask(task.id)}
                  onEdit={() => handleEditTask(task)}
                  onCancel={() => handleCancelTask(task)}
                  onRate={task.status === 'completed' && !task.rating ? () => handleRateTask(task) : undefined}
                  showEdit={true}
                  showCancel={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {loading ? (
            <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
              {[1, 2].map(i => (
                <TaskCardSkeleton key={i} />
              ))}
            </div>
          ) : [...filterTasks('accepted'), ...filterTasks('in_progress')].length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No tasks in progress</p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
              {[...filterTasks('accepted'), ...filterTasks('in_progress')].map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={() => handleViewTask(task.id)}
                  onEdit={() => handleEditTask(task)}
                  onRate={task.status === 'completed' && !task.rating ? () => handleRateTask(task) : undefined}
                  showEdit={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {loading ? (
            <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
              {[1, 2].map(i => (
                <TaskCardSkeleton key={i} />
              ))}
            </div>
          ) : filterTasks('completed').length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No completed tasks</p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
              {filterTasks('completed').map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={() => handleViewTask(task.id)}
                  onEdit={() => handleEditTask(task)}
                  onRate={task.status === 'completed' && !task.rating ? () => handleRateTask(task) : undefined}
                  showEdit={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Button
        size="lg"
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-hover xl:h-16 xl:w-16 bg-secondary hover:bg-secondary/90"
        onClick={() => setShowPostDialog(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <TaskPostDialog
        open={showPostDialog}
        onOpenChange={setShowPostDialog}
        onSuccess={handleTaskPosted}
      />

      {editingTask && (
        <TaskEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={handleTaskUpdated}
          task={editingTask}
        />
      )}

      {cancellingTask && user && (
        <CancelTaskDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          taskId={cancellingTask.id}
          taskTitle={cancellingTask.title}
          userId={user.id}
          onSuccess={handleCancelSuccess}
        />
      )}
      
      {/* Notification Dialog */}
      <NotificationDialog
        open={showNotification}
        onOpenChange={setShowNotification}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
        onAction={notificationTaskId ? () => navigate(`/task/${notificationTaskId}`) : undefined}
        actionLabel={notificationTaskId ? 'View Task' : undefined}
      />

      {ratingTask && (
        <RatingDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          taskId={ratingTask.id}
          bondhuId={tasks.find(t => t.id === ratingTask.id)?.assignment?.bondhu_id || ''}
          onSuccess={handleRatingSuccess}
        />
      )}
      </div>
    </div>
  );
}
