/**
 * Location Tracking Service
 * Manages real-time location tracking for Bondhu during task execution
 */

import { watchLocation, clearLocationWatch } from '@/lib/mapUtils';
import { insertBondhuLocation } from '@/db/locationApi';
import { toast } from '@/hooks/use-toast';

interface TrackingSession {
  watchId: number | null;
  taskId: string;
  bondhuId: string;
  isTracking: boolean;
  lastUpdate: Date | null;
}

class LocationTrackingService {
  private sessions: Map<string, TrackingSession> = new Map();
  private updateInterval: number = 5000; // Update every 5 seconds

  /**
   * Start tracking Bondhu location for a task
   */
  startTracking(bondhuId: string, taskId: string): boolean {
    const sessionKey = `${bondhuId}-${taskId}`;

    // Check if already tracking
    if (this.sessions.has(sessionKey)) {
      console.log('Already tracking this session');
      return true;
    }

    // Start watching location
    const watchId = watchLocation((location) => {
      this.handleLocationUpdate(bondhuId, taskId, location);
    });

    if (!watchId) {
      toast({
        title: 'Location Error',
        description: 'Unable to access your location. Please enable location services.',
        variant: 'destructive',
      });
      return false;
    }

    // Create tracking session
    this.sessions.set(sessionKey, {
      watchId,
      taskId,
      bondhuId,
      isTracking: true,
      lastUpdate: null,
    });

    console.log(`Started tracking for Bondhu ${bondhuId} on task ${taskId}`);
    
    toast({
      title: 'Location Tracking Started',
      description: 'Your location is being shared with the task poster.',
    });

    return true;
  }

  /**
   * Stop tracking Bondhu location for a task
   */
  stopTracking(bondhuId: string, taskId: string): void {
    const sessionKey = `${bondhuId}-${taskId}`;
    const session = this.sessions.get(sessionKey);

    if (!session) {
      console.log('No tracking session found');
      return;
    }

    // Stop watching location
    if (session.watchId) {
      clearLocationWatch(session.watchId);
    }

    // Remove session
    this.sessions.delete(sessionKey);

    console.log(`Stopped tracking for Bondhu ${bondhuId} on task ${taskId}`);
    
    toast({
      title: 'Location Tracking Stopped',
      description: 'Your location is no longer being shared.',
    });
  }

  /**
   * Stop all tracking sessions for a Bondhu
   */
  stopAllTracking(bondhuId: string): void {
    const sessionsToStop: string[] = [];

    // Find all sessions for this Bondhu
    this.sessions.forEach((session, key) => {
      if (session.bondhuId === bondhuId) {
        sessionsToStop.push(key);
      }
    });

    // Stop each session
    sessionsToStop.forEach((key) => {
      const session = this.sessions.get(key);
      if (session) {
        this.stopTracking(session.bondhuId, session.taskId);
      }
    });
  }

  /**
   * Handle location update
   */
  private async handleLocationUpdate(
    bondhuId: string,
    taskId: string,
    location: { lat: number; lng: number; accuracy?: number }
  ): Promise<void> {
    const sessionKey = `${bondhuId}-${taskId}`;
    const session = this.sessions.get(sessionKey);

    if (!session || !session.isTracking) {
      return;
    }

    // Throttle updates (only send if enough time has passed)
    const now = new Date();
    if (session.lastUpdate) {
      const timeSinceLastUpdate = now.getTime() - session.lastUpdate.getTime();
      if (timeSinceLastUpdate < this.updateInterval) {
        return; // Skip this update
      }
    }

    // Send location update to database
    try {
      const result = await insertBondhuLocation({
        bondhu_id: bondhuId,
        task_id: taskId,
        location_lat: location.lat,
        location_lng: location.lng,
        accuracy: location.accuracy,
      });

      if (result) {
        // Update last update time
        session.lastUpdate = now;
        console.log('Location updated:', location);
      } else {
        console.error('Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  /**
   * Check if currently tracking
   */
  isTracking(bondhuId: string, taskId: string): boolean {
    const sessionKey = `${bondhuId}-${taskId}`;
    const session = this.sessions.get(sessionKey);
    return session?.isTracking || false;
  }

  /**
   * Get active tracking sessions
   */
  getActiveSessions(): TrackingSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Set update interval (in milliseconds)
   */
  setUpdateInterval(interval: number): void {
    this.updateInterval = interval;
  }
}

// Export singleton instance
export const locationTrackingService = new LocationTrackingService();
