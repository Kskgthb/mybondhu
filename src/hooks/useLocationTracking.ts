/**
 * useLocationTracking Hook
 * Automatically manages location tracking for Bondhu during task execution
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { locationTrackingService } from '@/services/locationTrackingService';
import { toast } from '@/hooks/use-toast';

interface UseLocationTrackingOptions {
  taskId: string | null;
  enabled: boolean; // Should tracking be active?
}

export function useLocationTracking({ taskId, enabled }: UseLocationTrackingOptions) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !taskId || !enabled) {
      return;
    }

    // Start tracking
    const success = locationTrackingService.startTracking(user.id, taskId);

    if (!success) {
      console.error('Failed to start location tracking');
    }

    // Cleanup: stop tracking when component unmounts or conditions change
    return () => {
      if (user && taskId) {
        locationTrackingService.stopTracking(user.id, taskId);
      }
    };
  }, [user, taskId, enabled]);

  const startTracking = useCallback(() => {
    if (!user || !taskId) {
      toast({
        title: 'Error',
        description: 'Unable to start tracking: missing user or task information',
        variant: 'destructive',
      });
      return false;
    }

    return locationTrackingService.startTracking(user.id, taskId);
  }, [user, taskId]);

  const stopTracking = useCallback(() => {
    if (!user || !taskId) return;
    locationTrackingService.stopTracking(user.id, taskId);
  }, [user, taskId]);

  const isTracking = useCallback(() => {
    if (!user || !taskId) return false;
    return locationTrackingService.isTracking(user.id, taskId);
  }, [user, taskId]);

  return {
    startTracking,
    stopTracking,
    isTracking: isTracking(),
  };
}
