import { supabase } from './supabase';
import type {
  Profile,
  Task,
  TaskAssignment,
  Rating,
  Notification,
  TaskWithDistance,
  TaskWithPoster,
  TaskWithAssignment,
  TaskWithFullInfo,
  UserRole,
  Message,
} from '@/types/types';

export const profilesApi = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return this.getProfile(user.id);
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateLocation(userId: string, lat: number, lng: number): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        location_lat: lat,
        location_lng: lng,
        location_updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  },

  async updateAvailability(userId: string, available: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ availability_status: available })
      .eq('id', userId);

    if (error) throw error;
  },

  async getAllProfiles(page = 0, pageSize = 20): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  },

  async requestWithdrawal(amount: number, upiId: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('withdraw_request', {
      p_amount: amount,
      p_upi_id: upiId,
    });

    if (error) throw error;
    return data;
  },

  async getUserPreferences(userId: string) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') throw error; // ignore not found
    return data;
  },

  async updateUserPreferences(userId: string, updates: any) {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, ...updates })
      .eq('user_id', userId);
      
    if (error) throw error;
  },

  async trackInteraction(userId: string, category: string, weightIncrease: number) {
    if (!userId || !category) return;
    
    // Asynchronously call the RPC, don't wait for it to avoid blocking UI
    supabase.rpc('update_user_interest_profile', {
      p_user_id: userId,
      p_category: category,
      p_weight_increase: weightIncrease
    }).then(({ error }) => {
      if (error) console.error('Failed to track interaction:', error);
    });
  }
};

export const tasksApi = {
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'status' | 'payment_status' | 'proof_url'>): Promise<Task | null> {
    console.log('🔄 API: Creating task...', task);
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .maybeSingle();

    if (error) {
      console.error('❌ API: Error creating task:', error);
      throw error;
    }
    
    console.log('✅ API: Task created:', data);
    return data;
  },

  async getTask(taskId: string, retries = 3): Promise<Task | null> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .maybeSingle();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error(`Attempt ${attempt}/${retries} failed to load task:`, error);
        if (attempt === retries) throw error;
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
    return null;
  },

  async getTaskWithPoster(taskId: string, retries = 3): Promise<TaskWithPoster | null> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*, poster:profiles!poster_id(*)')
          .eq('id', taskId)
          .maybeSingle();

        if (error) throw error;
        return data as TaskWithPoster | null;
      } catch (error) {
        console.error(`Attempt ${attempt}/${retries} failed to load task with poster:`, error);
        if (attempt === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
    return null;
  },

  async getTaskWithAssignment(taskId: string, retries = 3): Promise<TaskWithAssignment | null> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            assignment:task_assignments(*),
            bondhu:task_assignments(bondhu:profiles(*))
          `)
          .eq('id', taskId)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) return null;
        
        const assignment = Array.isArray(data.assignment) ? data.assignment[0] : data.assignment;
        const bondhuData = Array.isArray(data.bondhu) ? data.bondhu[0] : data.bondhu;
        const bondhu = bondhuData?.bondhu || null;
        
        return {
          ...data,
          assignment: assignment || null,
          bondhu,
        } as TaskWithAssignment;
      } catch (error) {
        console.error(`Attempt ${attempt}/${retries} failed to load task with assignment:`, error);
        if (attempt === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
    return null;
  },

  async getMyTasks(userId: string, status?: string, page = 0, pageSize = 20): Promise<TaskWithFullInfo[]> {
    let query = supabase
      .from('tasks')
      .select('*, assignment:task_assignments(*), rating:ratings(*)')
      .eq('poster_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    
    // Process data to match TaskWithFullInfo structure
    const processedData = (data || []).map(item => {
      const assignment = Array.isArray(item.assignment) ? item.assignment[0] : item.assignment;
      const rating = Array.isArray(item.rating) ? item.rating[0] : item.rating;
      return {
        ...item,
        assignment: assignment || null,
        rating: rating || null,
        bondhu: null
      };
    });

    return processedData as TaskWithFullInfo[];
  },

  async getNearbyTasks(lat: number, lng: number, maxDistance = 50): Promise<TaskWithDistance[]> {
    const { data, error } = await supabase.rpc('get_nearby_tasks', {
      user_lat: lat,
      user_lng: lng,
      max_distance_km: maxDistance,
    });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },

  async getAllTasks(page = 0, pageSize = 20): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getCompletionCode(taskId: string, retries = 3): Promise<string | null> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('task_assignments')
          .select('completion_code')
          .eq('task_id', taskId)
          .maybeSingle();

        if (error) throw error;
        return data?.completion_code || null;
      } catch (error) {
        console.error(`Attempt ${attempt}/${retries} failed to load completion code:`, error);
        if (attempt === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
    return null;
  },

  async completeTaskWithCode(taskId: string, code: string, retries = 3): Promise<{ success: boolean; message: string; payment_method?: string; requires_payment?: boolean; auto_completed?: boolean }> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${retries} - Calling complete_task_with_code RPC with:`, {
          p_task_id: taskId,
          p_completion_code: code,
        });

        const { data, error } = await supabase.rpc('complete_task_with_code', {
          p_task_id: taskId,
          p_completion_code: code,
        });

        console.log('📊 RPC response:', { data, error });

        if (error) {
          console.error('❌ RPC error:', error);
          if (attempt === retries) {
            return { success: false, message: error.message };
          }
          throw error;
        }

        if (!data) {
          console.warn('⚠️ RPC returned null data');
          if (attempt === retries) {
            return { success: false, message: 'No response from server. The RPC function may not exist or returned null.' };
          }
          throw new Error('RPC returned null');
        }

        return data;
      } catch (error: any) {
        console.error(`Attempt ${attempt}/${retries} failed to complete task with code:`, error);
        if (attempt === retries) {
          return { success: false, message: error.message || 'Failed to verify code' };
        }
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
    return { success: false, message: 'Failed to verify code after multiple attempts' };
  },

  async verifyPaymentAndComplete(taskId: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('verify_payment_and_complete', {
      p_task_id: taskId,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return data || { success: false, message: 'Unknown error occurred' };
  },

  async bondhuConfirmPaymentReceived(taskId: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('bondhu_confirm_payment_received', {
      p_task_id: taskId,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return data || { success: false, message: 'Unknown error occurred' };
  },

  async cancelTask(taskId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // First verify the task belongs to the user and is in pending status
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('status, poster_id')
        .eq('id', taskId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (!task) {
        return { success: false, message: 'Task not found' };
      }

      if (task.poster_id !== userId) {
        return { success: false, message: 'You are not authorized to cancel this task' };
      }

      if (task.status !== 'pending') {
        return { success: false, message: 'Only pending tasks can be cancelled' };
      }

      // Update task status to cancelled
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      return { success: true, message: 'Task cancelled successfully' };
    } catch (error: any) {
      console.error('Error cancelling task:', error);
      return { success: false, message: error.message || 'Failed to cancel task' };
    }
  },
};

export const assignmentsApi = {
  async acceptTask(taskId: string, bondhuId: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('accept_task', {
      p_task_id: taskId,
      p_bondhu_id: bondhuId,
    });

    if (error) throw error;
    return data || { success: true, message: 'Task accepted successfully' };
  },

  async declineTask(taskId: string, bondhuId: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('decline_task', {
      p_task_id: taskId,
      p_bondhu_id: bondhuId,
    });

    if (error) throw error;
    return data || { success: true, message: 'Task declined successfully' };
  },

  async startTask(taskId: string, bondhuId: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('start_task', {
      p_task_id: taskId,
      p_bondhu_id: bondhuId,
    });

    if (error) throw error;
    return data || { success: true, message: 'Task started successfully' };
  },

  async completeTask(taskId: string, bondhuId: string, proofUrl?: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('complete_task', {
      p_task_id: taskId,
      p_bondhu_id: bondhuId,
      p_proof_url: proofUrl || null,
    });

    if (error) throw error;
    return data || { success: true, message: 'Task completed successfully' };
  },

  async completeTaskWithCode(taskId: string, completionCode: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('complete_task_with_code', {
      p_task_id: taskId,
      p_completion_code: completionCode,
    });

    if (error) throw error;
    return data || { success: true, message: 'Task completed with code successfully' };
  },

  async getCompletionCode(taskId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('task_assignments')
      .select('completion_code')
      .eq('task_id', taskId)
      .maybeSingle();

    if (error) throw error;
    return data?.completion_code || null;
  },

  async updateCompletionProof(taskId: string, bondhuId: string, proofUrl: string): Promise<void> {
    const { error } = await supabase
      .from('task_assignments')
      .update({ proof_url: proofUrl })
      .eq('task_id', taskId)
      .eq('bondhu_id', bondhuId);

    if (error) throw error;
  },

  async getMyAssignments(bondhuId: string, status?: string, page = 0, pageSize = 20): Promise<TaskWithAssignment[]> {
    let query = supabase
      .from('task_assignments')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('bondhu_id', bondhuId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    
    if (!Array.isArray(data)) return [];
    
    return data.map(item => ({
      ...item.task,
      assignment: item,
      bondhu: null,
    })) as TaskWithAssignment[];
  },

  async getAssignment(taskId: string, bondhuId: string): Promise<TaskAssignment | null> {
    const { data, error } = await supabase
      .from('task_assignments')
      .select('*')
      .eq('task_id', taskId)
      .eq('bondhu_id', bondhuId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getByBondhuWithProof(bondhuId: string, limit = 20): Promise<any[]> {
    const { data, error } = await supabase
      .from('task_assignments')
      .select(`
        id,
        task_id,
        bondhu_id,
        proof_url,
        updated_at,
        task:tasks(
          title,
          amount,
          location,
          category
        )
      `)
      .eq('bondhu_id', bondhuId)
      .not('proof_url', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    if (!Array.isArray(data)) return [];
    
    return data.map(item => {
      const taskData = Array.isArray(item.task) ? item.task[0] : item.task;
      return {
        id: item.id,
        task_id: item.task_id,
        bondhu_id: item.bondhu_id,
        proof_url: item.proof_url,
        updated_at: item.updated_at,
        task_title: taskData?.title,
        task_amount: taskData?.amount,
        task_location: taskData?.location,
        task_category: taskData?.category,
      };
    });
  },
};

export const ratingsApi = {
  async createRating(rating: Omit<Rating, 'id' | 'created_at'>): Promise<Rating | null> {
    const { data, error } = await supabase
      .from('ratings')
      .insert(rating)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getRatingForTask(taskId: string): Promise<Rating | null> {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getRatingsForBondhu(bondhuId: string, page = 0, pageSize = 20): Promise<Rating[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('bondhu_id', bondhuId)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async updateRating(ratingId: string, updates: Partial<Rating>): Promise<Rating | null> {
    const { data, error } = await supabase
      .from('ratings')
      .update(updates)
      .eq('id', ratingId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};

export const notificationsApi = {
  async getMyNotifications(userId: string, unreadOnly = false, page = 0, pageSize = 20): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },

  async markAsRead(notificationIds: string[]): Promise<void> {
    const { error } = await supabase.rpc('mark_notifications_read', {
      notification_ids: notificationIds,
    });

    if (error) throw error;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },
};

export const storageApi = {
  async uploadTaskProof(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('app-83dmv202aiv5_task_proofs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('app-83dmv202aiv5_task_proofs')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  async deleteTaskProof(url: string): Promise<void> {
    const fileName = url.split('/').slice(-2).join('/');

    const { error } = await supabase.storage
      .from('app-83dmv202aiv5_task_proofs')
      .remove([fileName]);

    if (error) throw error;
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatars/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('app-83dmv202aiv5_bondhu_documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('app-83dmv202aiv5_bondhu_documents')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },
};

export const realtimeApi = {
  subscribeToTasks(callback: (payload: any) => void) {
    return supabase
      .channel('tasks-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
      .subscribe();
  },

  subscribeToTaskAssignments(callback: (payload: any) => void) {
    return supabase
      .channel('task-assignments-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignments' }, callback)
      .subscribe();
  },

  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        callback
      )
      .subscribe();
  },

  unsubscribe(channel: any) {
    return supabase.removeChannel(channel);
  },
};

export const messagesApi = {
  async getMessages(taskId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async sendMessage(taskId: string, message: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        task_id: taskId,
        sender_id: user.id,
        message,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  subscribeToMessages(taskId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  },

  unsubscribe(channel: any) {
    return supabase.removeChannel(channel);
  },
};

export async function uploadDocument(
  userId: string,
  file: File,
  documentType: 'photo' | 'college_id' | 'aadhaar'
): Promise<string> {
  console.log(`📤 Starting upload for ${documentType}:`, {
    userId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });

  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${documentType}/${Date.now()}.${fileExt}`;
  
  console.log(`📂 Storage path: ${fileName}`);

  const { error: uploadError } = await supabase.storage
    .from('app-83dmv202aiv5_bondhu_documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error(`❌ Upload failed for ${documentType}:`, uploadError);
    
    // Provide more specific error messages
    let errorMessage = uploadError.message;
    
    if (uploadError.message?.includes('row-level security')) {
      errorMessage = 'Permission denied. Please make sure you are logged in.';
    } else if (uploadError.message?.includes('size')) {
      errorMessage = 'File is too large. Please use a file smaller than 5MB.';
    } else if (uploadError.message?.includes('type') || uploadError.message?.includes('mime')) {
      errorMessage = 'Invalid file type. Please use JPEG, PNG, or WebP images.';
    } else if (uploadError.message?.includes('network') || uploadError.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    }
    
    const error = new Error(errorMessage);
    (error as any).originalError = uploadError;
    throw error;
  }

  console.log(`✅ File uploaded successfully to storage: ${fileName}`);

  const { data } = supabase.storage
    .from('app-83dmv202aiv5_bondhu_documents')
    .getPublicUrl(fileName);

  console.log(`🔗 Public URL generated: ${data.publicUrl}`);

  return data.publicUrl;
}

export async function updateBondhuProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
}
