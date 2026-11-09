import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { tasksApi, assignmentsApi, ratingsApi, storageApi, profilesApi } from '@/db/api';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, MapPin, Clock, IndianRupee, User, Star, Upload, CheckCircle, CheckCircle2, ExternalLink, Navigation, MessageCircle, Phone, Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { TaskWithAssignment, Rating } from '@/types/types';
import RatingDialog from '@/components/task/RatingDialog';
import ChatDialog from '@/components/task/ChatDialog';
import CompletionCodeDisplay from '@/components/task/CompletionCodeDisplay';
import CompletionCodeInput from '@/components/task/CompletionCodeInput';
import PaymentQRCode from '@/components/payment/PaymentQRCode';
import ImageLightbox from '@/components/ui/image-lightbox';
import { getCategoryLabel, getCategoryIcon } from '@/lib/categories';

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskWithAssignment | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [completionCode, setCompletionCode] = useState<string | null>(null);

  useEffect(() => {
    loadTaskDetails();
    
    // Smart polling strategy based on task status
    const getPollingInterval = () => {
      if (!task) return 10000; // 10 seconds for initial state
      
      // Fast polling (5s) when waiting for critical updates
      if (task.code_verified && !task.payment_verified) {
        return 5000; // Waiting for payment verification
      }
      
      if (task.status === 'in_progress') {
        return 8000; // Task in progress, moderate polling
      }
      
      if (task.status === 'completed') {
        return 15000; // Completed tasks change less frequently
      }
      
      return 10000; // Default: 10 seconds
    };
    
    const pollingInterval = setInterval(() => {
      console.log('🔄 Polling task details...');
      loadTaskDetails();
    }, getPollingInterval());
    
    return () => {
      clearInterval(pollingInterval);
    };
  }, [taskId, task?.status, task?.code_verified, task?.payment_verified]);

  // Smart Notification System: Track Bondhu interest when they view a task
  useEffect(() => {
    if (task && user && task.poster_id !== user.id && (profile?.active_role === 'bondhu' || profile?.role === 'bondhu')) {
      // Small weight increase for just viewing a task
      profilesApi.trackInteraction(user.id, task.category, 0.05);
    }
  }, [task?.id, user?.id]);

  const loadTaskDetails = async () => {
    if (!taskId) return;
    
    // CRITICAL: Only show loading spinner on true initial load (no task data at all)
    // Never show loading spinner during background updates to prevent flickering
    const isInitialLoad = !task;
    if (isInitialLoad) {
      setLoading(true);
    }
    
    try {
      // Retry logic for task data
      let taskData: TaskWithAssignment | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          taskData = await tasksApi.getTaskWithAssignment(taskId);
          break;
        } catch (error) {
          console.error(`Attempt ${attempt}/3 failed to load task:`, error);
          if (attempt === 3) throw error;
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
      
      // Only update state if we got valid data (prevents flickering from null data)
      if (taskData) {
        setTask(taskData);
      }
      
      // Retry logic for rating data
      let ratingData: Rating | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          ratingData = await ratingsApi.getRatingForTask(taskId).catch(() => null);
          break;
        } catch (error) {
          console.error(`Attempt ${attempt}/3 failed to load rating:`, error);
          if (attempt === 3) {
            ratingData = null; // Don't fail if rating can't be loaded
          }
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
      
      setRating(ratingData);

      // Load completion code if task is accepted, in progress, or completed
      if (taskData && (taskData.status === 'accepted' || taskData.status === 'in_progress' || taskData.status === 'completed')) {
        // Retry logic for completion code
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const code = await tasksApi.getCompletionCode(taskId);
            setCompletionCode(code);
            break;
          } catch (error) {
            console.error(`Attempt ${attempt}/3 failed to load completion code:`, error);
            if (attempt === 3) {
              // Don't fail completely, just log the error
              console.error('Failed to load completion code after 3 attempts');
              // Don't show error toast on background updates
              if (isInitialLoad) {
                toast.error('Failed to load completion code. Please refresh.');
              }
            }
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          }
        }
      }
    } catch (error) {
      console.error('Error loading task:', error);
      // Only show error toast on initial load, not on background refreshes
      if (isInitialLoad) {
        toast.error('Failed to load task details. Retrying...');
      }
      // Don't clear existing task data on error - keep showing what we have
    } finally {
      // Only clear loading state on initial load
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const handleStartTask = async () => {
    if (!task || !user) return;
    
    setActionLoading(true);
    try {
      await assignmentsApi.startTask(task.id, user.id);
      toast.success('Task started!');
      loadTaskDetails();
    } catch (error: any) {
      console.error('Error starting task:', error);
      toast.error(error.message || 'Failed to start task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!task || !user) return;
    
    setActionLoading(true);
    try {
      let proofUrl: string | undefined;
      
      if (proofFile) {
        toast.info('Uploading proof...');
        proofUrl = await storageApi.uploadTaskProof(user.id, proofFile);
      }
      
      await assignmentsApi.completeTask(task.id, user.id, proofUrl);
      toast.success('Task completed!');
      loadTaskDetails();
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast.error(error.message || 'Failed to complete task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteWithCode = async (code: string) => {
    if (!taskId) return;
    setActionLoading(true);
    try {
      console.log('🔑 Verifying completion code and completing task:', taskId);
      // 1. Verify the code
      const result = await tasksApi.completeTaskWithCode(taskId, code);
      if (!result.success) {
        throw new Error(result.message || 'Invalid completion code');
      }

      // 2. Call backend verification RPC
      try {
        await tasksApi.verifyPaymentAndComplete(taskId);
      } catch (err) {
        console.warn('verifyPaymentAndComplete fallback:', err);
      }

      // 3. Guarantee database updates for status, payment, and bondhu earnings
      await supabase.from('tasks').update({
        status: 'completed',
        code_verified: true,
        code_verified_at: new Date().toISOString(),
        payment_verified: true,
        payment_verified_at: new Date().toISOString(),
        payment_status: 'completed',
        completion_step: 'completed',
        updated_at: new Date().toISOString(),
      }).eq('id', taskId);

      const bondhuId = task?.assignment?.bondhu_id || user?.id;
      if (bondhuId) {
        await supabase.from('task_assignments').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        }).eq('task_id', taskId);

        // Update bondhu earnings and task count
        if (task?.amount) {
          const { data: bProfile } = await supabase
            .from('profiles')
            .select('total_tasks, total_earnings')
            .eq('id', bondhuId)
            .maybeSingle();

          if (bProfile) {
            await supabase.from('profiles').update({
              total_tasks: (bProfile.total_tasks || 0) + 1,
              total_earnings: (Number(bProfile.total_earnings) || 0) + Number(task.amount),
            }).eq('id', bondhuId);
          }
        }
      }

      toast.success('🎉 Payment confirmed & Task completed successfully!');

      // Reload task details to get completed state
      await loadTaskDetails();
    } catch (error: any) {
      console.error('❌ Error completing task:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handlePosterPaymentDone = async () => {
    if (!task) return;
    setActionLoading(true);
    try {
      await supabase.from('tasks').update({
        payment_verified: true,
        payment_verified_at: new Date().toISOString(),
        payment_status: 'completed',
        updated_at: new Date().toISOString(),
      }).eq('id', task.id);

      toast.success('✓ Payment confirmed! Your Task Completion Code is available below.');
      setShowPaymentModal(false);
      await loadTaskDetails();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update payment status: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRatingSubmitted = () => {
    setShowRatingDialog(false);
    loadTaskDetails();
    toast.success('Rating submitted successfully!');
  };

  const handleConfirmPayment = async () => {
    if (!task || !user) return;
    
    setActionLoading(true);
    try {
      console.log('🔄 Confirming payment for task:', task.id);
      const result = await tasksApi.verifyPaymentAndComplete(task.id);
      
      if (result.success) {
        console.log('✅ Payment confirmed successfully');
        toast.success('Payment confirmed! Task completed successfully.');
        
        // Wait a moment for database to commit
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force reload task details
        console.log('🔄 Reloading task details...');
        await loadTaskDetails();
        
        // Verify task status was updated
        const updatedTask = await tasksApi.getTaskWithAssignment(task.id);
        console.log('📊 Updated task status:', updatedTask?.status);
        console.log('📊 Updated task payment_verified:', updatedTask?.payment_verified);
        console.log('📊 Updated task completion_step:', updatedTask?.completion_step);
        
        if (updatedTask) {
          setTask(updatedTask);
        }
        
        // Show rating dialog after payment confirmation
        if (updatedTask?.status === 'completed') {
          setTimeout(() => {
            console.log('⭐ Opening rating dialog');
            setShowRatingDialog(true);
          }, 1000);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('❌ Error confirming payment:', error);
      toast.error(error.message || 'Failed to confirm payment');
    } finally {
      setActionLoading(false);
    }
  };

  const canStartTask = task && user && task.assignment?.bondhu_id === user.id && task.status === 'accepted';
  const canCompleteTask = task && user && task.assignment?.bondhu_id === user.id && task.status === 'in_progress';
  const canRate = task && user && task.poster_id === user.id && task.status === 'completed' && !rating;
  const canTrack = task && user && task.poster_id === user.id && (task.status === 'accepted' || task.status === 'in_progress');
  const canChat = task && user && task.assignment?.bondhu_id && (task.status === 'accepted' || task.status === 'in_progress' || task.status === 'completed');
  const isBondhu = task && user && task.assignment?.bondhu_id === user.id;
  const isPoster = task && user && task.poster_id === user.id;
  const canConfirmPayment = task && user && task.poster_id === user.id && task.code_verified && !task.payment_verified && task.payment_method === 'online';
  
  const getChatUserName = () => {
    if (!task) return '';
    if (isPoster) return task.bondhu?.username || 'Bondhu';
    return 'Task Poster';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Task not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-accent/20 text-accent-foreground',
    accepted: 'bg-info/20 text-info',
    in_progress: 'bg-warning/20 text-warning',
    completed: 'bg-success/20 text-success',
    cancelled: 'bg-muted text-muted-foreground',
  };

  const urgencyColors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-info/20 text-info',
    high: 'bg-warning/20 text-warning',
    urgent: 'bg-destructive/20 text-destructive',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{task.title}</CardTitle>
              <CardDescription className="text-base">{task.description}</CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Badge className={statusColors[task.status]} variant="secondary">
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge className={urgencyColors[task.urgency]} variant="secondary">
                {task.urgency}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Location</p>
                <a 
                  href={`https://www.google.com/maps?q=${task.location_lat},${task.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <span>{task.location_address}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Amount</p>
                <p className="text-sm text-primary font-semibold">₹{task.amount}</p>
              </div>
            </div>
            {task.payment_method && (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">
                  {task.payment_method === 'cash' ? '💵' : '💳'}
                </div>
                <div>
                  <p className="text-sm font-medium">Payment Mode</p>
                  <p className="text-sm text-muted-foreground">
                    {task.payment_method === 'cash' ? 'Cash (Offline)' : 'Online Payment'}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Posted</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(() => {
                const CategoryIcon = getCategoryIcon(task.category);
                return CategoryIcon ? <CategoryIcon className="h-5 w-5 text-muted-foreground" /> : <User className="h-5 w-5 text-muted-foreground" />;
              })()}
              <div>
                <p className="text-sm font-medium">Category</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{getCategoryLabel(task.category)}</p>
                  {['academic_help', 'creative_services', 'personal_task', 'event_planning', 'trending'].includes(task.category) && (
                    <Badge className="bg-red-500 text-white animate-pulse border-none text-[9px] h-4 px-1 font-bold uppercase tracking-wider">
                      Live
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {task.assignment?.proof_url && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Task Completion Proof</p>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <ImageLightbox
                  imageUrl={task.assignment.proof_url}
                  alt="Task completion proof"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Click image to view full size
                </p>
              </div>
            </>
          )}

          {rating && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Rating & Review</p>
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < rating.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
                    />
                  ))}
                  <span className="text-sm font-medium">{rating.rating}/5</span>
                </div>
                {rating.review && (
                  <p className="text-sm text-muted-foreground">{rating.review}</p>
                )}
              </div>
            </>
          )}

          {/* ── BONDHU (HELPER) SIDE CONTROLS ── */}
          {isBondhu && (
            <>
              <Separator />
              <div className="space-y-4">
                {canStartTask && (
                  <Button
                    onClick={handleStartTask}
                    disabled={actionLoading}
                    className="w-full min-h-[48px] text-base font-bold bg-[#641ACC] hover:bg-[#5214ab]"
                  >
                    {actionLoading ? 'Starting...' : 'Start Task'}
                  </Button>
                )}
                
                {canCompleteTask && (
                  <CompletionCodeInput
                    taskId={task.id}
                    taskTitle={task.title}
                    onComplete={handleCompleteWithCode}
                    isLoading={actionLoading}
                  />
                )}

                {/* Show completion confirmation to Bondhu */}
                {task.status === 'completed' && (
                  <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <CardTitle className="text-lg text-green-700 dark:text-green-300">Task Completed!</CardTitle>
                      </div>
                      <CardDescription className="text-green-600 dark:text-green-400">
                        You have successfully completed this task.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Task</p>
                        <p className="text-sm text-muted-foreground">{task.title}</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Amount Earned</p>
                        <p className="text-xl font-bold text-center text-green-600 dark:text-green-400">
                          ₹{task.amount}
                        </p>
                      </div>
                      <div className="pt-2 space-y-1">
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ✓ Task verified with completion code
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ✓ Earnings credited to your Bondhu wallet
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {/* ── TASK POSTER SIDE CONTROLS ── */}
          {isPoster && (task.status === 'accepted' || task.status === 'in_progress') && (
            <>
              <Separator />
              <div className="space-y-4">
                {/* 1. Green "Task Payment" button if not yet paid */}
                {!task.payment_verified && task.payment_status !== 'completed' ? (
                  <Card className="border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 p-5 shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                          </span>
                          <span className="text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                            Payment Required
                          </span>
                        </div>
                        <p className="text-white text-base font-bold">
                          Pay ₹{task.amount} to unlock Completion Code
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          Tap Task Payment below to scan or pay via razorpay.me/@bondhuapp
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full sm:w-auto px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-5 h-5 text-white" />
                        Task Payment (₹{task.amount})
                      </Button>
                    </div>
                  </Card>
                ) : (
                  /* 2. When payment is done: Task Completion Code appears! That's all on poster side! */
                  completionCode && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Payment Verified ✓ • Share this 6-digit code with your Bondhu once the task is finished to complete the task.</span>
                      </div>
                      <CompletionCodeDisplay
                        code={completionCode}
                        taskTitle={task.title}
                      />
                    </div>
                  )
                )}
              </div>
            </>
          )}

          {canRate && (
            <>
              <Separator />
              <Button
                onClick={() => setShowRatingDialog(true)}
                className="w-full min-h-[44px]"
              >
                <Star className="mr-2 h-4 w-4" />
                Rate & Review
              </Button>
            </>
          )}

          {canTrack && (
            <>
              <Separator />
              <Button
                onClick={() => navigate(`/track/${taskId}`)}
                className="w-full min-h-[44px]"
                variant="outline"
              >
                <Navigation className="mr-2 h-4 w-4" />
                Track Bondhu Live
              </Button>
            </>
          )}

          {/* Show task completed confirmation to task poster */}
          {isPoster && task.status === 'completed' && (
            <>
              <Separator />
              <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <CardTitle className="text-lg text-green-700 dark:text-green-300">Task Completed Successfully!</CardTitle>
                  </div>
                  <CardDescription className="text-green-600 dark:text-green-400">
                    The Bondhu has completed this task and verified it with the completion code.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Task Details</p>
                    <p className="text-sm text-muted-foreground">{task.title}</p>
                  </div>
                  {completionCode && (
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Verification Code Used</p>
                      <p className="text-2xl font-mono font-bold text-center text-green-600 dark:text-green-400 tracking-wider">
                        {completionCode}
                      </p>
                    </div>
                  )}
                  <div className="pt-2 space-y-2">
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ✓ Task verified and marked as complete
                    </p>
                    {!rating && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ Please rate and review the Bondhu's work
                      </p>
                    )}
                  </div>

                  {/* Show rating if already submitted */}
                  {rating ? (
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-3">Your Rating</p>
                      <div className="flex items-center gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= rating.rating
                                ? 'fill-accent text-accent'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                        <span className="text-sm font-medium text-green-700 dark:text-green-300 ml-2">
                          {rating.rating} out of 5
                        </span>
                      </div>
                      {rating.review && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Review:</p>
                          <p className="text-sm text-muted-foreground">{rating.review}</p>
                        </div>
                      )}
                      {rating.feedback && (
                        <div>
                          <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Feedback:</p>
                          <p className="text-sm text-muted-foreground">{rating.feedback}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowRatingDialog(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white min-h-[44px]"
                      size="lg"
                    >
                      <Star className="mr-2 h-5 w-5" />
                      Rate & Review Bondhu
                    </Button>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {canChat && (
            <>
              <Separator />
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => setShowChatDialog(true)}
                  className="w-full min-h-[44px]"
                  variant="outline"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat with {getChatUserName()}
                </Button>
                
                {/* Call button - Task Poster can call Bondhu */}
                {!isBondhu && task.bondhu?.phone && (
                  <Button
                    onClick={() => window.open(`tel:${task.bondhu?.phone}`, '_self')}
                    className="w-full min-h-[44px]"
                    variant="outline"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call Bondhu
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {task.assignment?.bondhu_id && (
        <>
          <RatingDialog
            open={showRatingDialog}
            onOpenChange={setShowRatingDialog}
            taskId={task.id}
            bondhuId={task.assignment.bondhu_id}
            onSuccess={handleRatingSubmitted}
          />
          
          <ChatDialog
            open={showChatDialog}
            onOpenChange={setShowChatDialog}
            taskId={task.id}
            otherUserName={getChatUserName()}
          />
        </>
      )}

      {/* Task Payment Modal for Poster */}
      {task && (
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="max-w-md p-0 overflow-hidden bg-slate-900 border border-emerald-500/30">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Task Payment
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Complete payment for "{task.title}" to unlock the completion code
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 pt-2">
              <PaymentQRCode
                amount={task.amount || 0}
                taskTitle={task.title}
                onPaymentDone={handlePosterPaymentDone}
                isSubmitting={actionLoading}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
