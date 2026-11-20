import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { profilesApi } from '@/db/api';
import { toast } from 'sonner';
import type { UserRole } from '@/types/types';
import { isAdminEmail, canSolveTasks } from '@/config/adminConfig';

interface RoleContextType {
  currentRole: UserRole | null;
  switchRole: () => Promise<void>;
  isSwitching: boolean;
  isAdmin: boolean;
  canSolve: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const userEmail = user?.email ?? profile?.email;
  const isAdmin = isAdminEmail(userEmail) || profile?.role === 'admin';
  const canSolve = canSolveTasks(userEmail, profile?.role);

  // Sync current role with profile and enforce freeze rules
  useEffect(() => {
    if (profile) {
      if (!canSolve) {
        // Non-admin users are strictly frozen to Task Post mode (Need Bondhu)
        setCurrentRole('need_bondhu');
      } else {
        // Admin can do both Task Post and Task Solve
        const activeRole = profile.active_role || (profile.role === 'bondhu' ? 'bondhu' : 'need_bondhu');
        setCurrentRole(activeRole);
      }
    } else {
      setCurrentRole(null);
    }
  }, [profile, canSolve]);

  const switchRole = async () => {
    if (!profile || isSwitching) return;

    // Strictly enforce: non-admins cannot switch to Task Solve (Bondhu) mode
    if (!canSolve) {
      toast.info('Task Solve mode is temporarily paused. Only Task Posting is active right now.');
      setCurrentRole('need_bondhu');
      return;
    }

    setIsSwitching(true);

    try {
      // Determine the new role for admin
      const currentActiveRole = currentRole || 'need_bondhu';
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
      const roleLabel = newRole === 'bondhu' ? 'Bondhu (Task Solve Mode)' : 'Need Bondhu (Task Post Mode)';
      toast.success(`Switched to ${roleLabel}`);

    } catch (error) {
      console.error('Error switching role:', error);
      toast.error('Failed to switch role. Please try again.');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <RoleContext.Provider value={{ currentRole, switchRole, isSwitching, isAdmin, canSolve }}>
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
