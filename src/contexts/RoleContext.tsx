import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { profilesApi } from '@/db/api';
import { toast } from 'sonner';
import type { UserRole } from '@/types/types';

interface RoleContextType {
  currentRole: UserRole | null;
  switchRole: () => Promise<void>;
  isSwitching: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, refreshProfile } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  // Sync current role with profile
  useEffect(() => {
    if (profile) {
      // Use active_role if available, otherwise fall back to role
      const activeRole = profile.active_role || profile.role;
      setCurrentRole(activeRole);
    } else {
      setCurrentRole(null);
    }
  }, [profile]);

  const switchRole = async () => {
    if (!profile || isSwitching) return;

    // Don't allow admin to switch roles
    if (profile.role === 'admin') {
      toast.error('Admin users cannot switch roles');
      return;
    }

    setIsSwitching(true);

    try {
      // Determine the new role
      const currentActiveRole = profile.active_role || profile.role;
      const newRole: UserRole = currentActiveRole === 'need_bondhu' ? 'bondhu' : 'need_bondhu';

      // Update the active_role in the database
      await profilesApi.updateProfile(profile.id, {
        active_role: newRole
      } as any);

      // Refresh profile to get updated data
      await refreshProfile();

      // Update local state
      setCurrentRole(newRole);

      // Show success message
      const roleLabel = newRole === 'bondhu' ? 'Bondhu (Helper)' : 'Need Bondhu (Task Poster)';
      toast.success(`Switched to ${roleLabel} mode`);

    } catch (error) {
      console.error('Error switching role:', error);
      toast.error('Failed to switch role. Please try again.');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <RoleContext.Provider value={{ currentRole, switchRole, isSwitching }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
