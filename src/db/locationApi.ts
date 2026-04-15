/**
 * Location API - Real-time Bondhu tracking functions
 */

import { supabase } from './supabase';

export interface LocationUpdate {
  bondhu_id: string;
  task_id?: string;
  location_lat: number;
  location_lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface BondhuLocation {
  id: string;
  bondhu_id: string;
  task_id: string | null;
  location_lat: number;
  location_lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  created_at: string;
}

export interface NearbyTask {
  task_id: string;
  title: string;
  description: string;
  location_lat: number;
  location_lng: number;
  location_address: string;
  distance_km: number;
  amount: number;
  urgency: string;
  status: string;
}

export interface ActiveTaskTracking {
  task_id: string;
  task_title: string;
  task_lat: number;
  task_lng: number;
  task_address: string;
  poster_id: string;
  bondhu_id: string;
  bondhu_name: string;
  bondhu_phone: string;
  bondhu_lat: number;
  bondhu_lng: number;
  bondhu_location_updated: string;
  assignment_status: string;
  task_status: string;
  task_created_at: string;
  accepted_at: string;
  started_at: string;
}

/**
 * Insert a new location update for Bondhu
 */
export async function insertBondhuLocation(location: LocationUpdate): Promise<BondhuLocation | null> {
  try {
    const { data, error } = await supabase
      .from('bondhu_locations')
      .insert({
        bondhu_id: location.bondhu_id,
        task_id: location.task_id || null,
        location_lat: location.location_lat,
        location_lng: location.location_lng,
        accuracy: location.accuracy || null,
        speed: location.speed || null,
        heading: location.heading || null,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error inserting Bondhu location:', error);
      return null;
    }

    // Also update the profile's current location
    await updateProfileLocation(location.bondhu_id, location.location_lat, location.location_lng);

    return data;
  } catch (error) {
    console.error('Error in insertBondhuLocation:', error);
    return null;
  }
}

/**
 * Update Bondhu's current location in profile
 */
export async function updateProfileLocation(
  bondhu_id: string,
  lat: number,
  lng: number
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('update_bondhu_location', {
      p_bondhu_id: bondhu_id,
      p_lat: lat,
      p_lng: lng,
    });

    if (error) {
      console.error('Error updating profile location:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateProfileLocation:', error);
    return false;
  }
}

/**
 * Get latest Bondhu location for a specific task
 */
export async function getBondhuLocationForTask(taskId: string): Promise<{
  bondhu_id: string;
  location_lat: number;
  location_lng: number;
  accuracy: number;
  updated_at: string;
} | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_bondhu_location_for_task', {
        p_task_id: taskId,
      });

    if (error) {
      console.error('Error getting Bondhu location for task:', error);
      return null;
    }

    // Check if data is an array and get first item
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }

    return data || null;
  } catch (error) {
    console.error('Error in getBondhuLocationForTask:', error);
    return null;
  }
}

/**
 * Get nearby tasks within radius
 */
export async function getNearbyTasks(
  lat: number,
  lng: number,
  radiusKm: number = 10
): Promise<NearbyTask[]> {
  try {
    const { data, error } = await supabase.rpc('get_nearby_tasks', {
      user_lat: lat,
      user_lng: lng,
      max_distance_km: radiusKm,
    });

    if (error) {
      console.error('Error getting nearby tasks:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error in getNearbyTasks:', error);
    return [];
  }
}

/**
 * Get active task tracking information
 */
export async function getActiveTaskTracking(taskId: string): Promise<ActiveTaskTracking | null> {
  try {
    const { data, error } = await supabase
      .from('active_task_tracking')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle();

    if (error) {
      console.error('Error getting active task tracking:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getActiveTaskTracking:', error);
    return null;
  }
}

/**
 * Get all active tasks being tracked (for task poster)
 */
export async function getMyActiveTasksTracking(posterId: string): Promise<ActiveTaskTracking[]> {
  try {
    const { data, error } = await supabase
      .from('active_task_tracking')
      .select('*')
      .eq('poster_id', posterId)
      .order('task_created_at', { ascending: false });

    if (error) {
      console.error('Error getting my active tasks tracking:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error in getMyActiveTasksTracking:', error);
    return [];
  }
}

/**
 * Subscribe to Bondhu location updates for a task
 */
export function subscribeToBondhuLocation(
  taskId: string,
  callback: (location: BondhuLocation) => void
) {
  const channel = supabase
    .channel(`bondhu-location-${taskId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bondhu_locations',
        filter: `task_id=eq.${taskId}`,
      },
      (payload) => {
        callback(payload.new as BondhuLocation);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to profile location updates for a Bondhu
 */
export function subscribeToProfileLocation(
  bondhuId: string,
  callback: (profile: { location_lat: number; location_lng: number; location_updated_at: string }) => void
) {
  const channel = supabase
    .channel(`profile-location-${bondhuId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${bondhuId}`,
      },
      (payload) => {
        const profile = payload.new as any;
        if (profile.location_lat && profile.location_lng) {
          callback({
            location_lat: profile.location_lat,
            location_lng: profile.location_lng,
            location_updated_at: profile.location_updated_at,
          });
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from location updates
 */
export async function unsubscribeFromLocation(channel: any) {
  if (channel) {
    await supabase.removeChannel(channel);
  }
}

/**
 * Get location history for a Bondhu on a specific task
 */
export async function getBondhuLocationHistory(
  bondhuId: string,
  taskId: string,
  limit: number = 50
): Promise<BondhuLocation[]> {
  try {
    const { data, error } = await supabase
      .from('bondhu_locations')
      .select('*')
      .eq('bondhu_id', bondhuId)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting Bondhu location history:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error in getBondhuLocationHistory:', error);
    return [];
  }
}

/**
 * Update task location
 */
export async function updateTaskLocation(
  taskId: string,
  lat: number,
  lng: number,
  address: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({
        location_lat: lat,
        location_lng: lng,
        location_address: address,
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task location:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTaskLocation:', error);
    return false;
  }
}
