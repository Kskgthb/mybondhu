import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/db/supabase';
import { profilesApi } from '@/db/api';
import { initializeNotificationSystem, subscribeToUserNotifications, unsubscribeNotifications, teardownSWRealtime } from '@/services/notificationService';
import type { Profile } from '@/types/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (username: string, password: string, role: 'need_bondhu' | 'bondhu', email?: string, phone?: string, referralCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

// Create context with null as default to avoid undefined issues
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const notificationsInitializedRef = useRef(false);
  const notifChannelRef = useRef<any>(null);

  const loadProfile = async (userId: string) => {
    try {
      const profileData = await profilesApi.getProfile(userId);
      setProfile(profileData);
      
      // Initialize push notifications ONCE after profile is loaded
      if (profileData && !notificationsInitializedRef.current) {
        notificationsInitializedRef.current = true;
        // Pass role so the SW knows whether to send proximity alerts (Bondhu only)
        initializeNotificationSystem(userId, profileData.active_role || profileData.role).catch((error) => {
          console.error('Failed to initialize notification system:', error);
        });
        // Subscribe to realtime notifications from Supabase (main thread backup)
        notifChannelRef.current = subscribeToUserNotifications(userId);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔐 Auth event: ${event}`, session?.user?.id ? `(user: ${session.user.id.slice(0, 8)}...)` : '');
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Load/reload profile on sign in, token refresh, or user update
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
          loadProfile(session.user.id);
        }
      } else {
        setProfile(null);
        // Cleanup notification subscription on sign out
        if (notifChannelRef.current) {
          unsubscribeNotifications(notifChannelRef.current);
          notifChannelRef.current = null;
          notificationsInitializedRef.current = false;
        }
        // Tear down the SW's background Realtime connection
        teardownSWRealtime().catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (username: string, password: string) => {
    // Try to find the user's email by username
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email, id')
      .eq('username', username)
      .maybeSingle();
    
    let email: string;
    
    if (profileData?.email) {
      // User has a real email
      email = profileData.email;
    } else {
      // Use the miaoda.com format
      email = `${username}@miaoda.com`;
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // Provide more specific error messages
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid username or password. Please check your credentials and try again.');
      } else if (error.message?.includes('Email not confirmed')) {
        throw new Error('Please verify your email address before signing in.');
      } else {
        throw error;
      }
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
      // Provide helpful error message for common issues
      if (error.message?.includes('provider is not enabled')) {
        throw new Error('Google Sign-In is not configured yet. Please contact the administrator to enable Google authentication.');
      }
      throw error;
    }
  };

  const signUp = async (
    username: string, 
    password: string, 
    role: 'need_bondhu' | 'bondhu',
    email?: string,
    phone?: string,
    referralCode?: string
  ) => {
    const authEmail = email || `${username}@miaoda.com`;
    
    // Check if referral code is valid
    let referredBy: string | null = null;
    if (referralCode) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode.toUpperCase())
        .maybeSingle();
      
      if (referrer) {
        referredBy = referrer.id;
      } else {
        throw new Error('Invalid referral code. Please check and try again, or leave it blank.');
      }
    }
    
    // Check if email already exists (if real email provided)
    if (email && !email.endsWith('@miaoda.com')) {
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      
      if (existingEmail) {
        throw new Error('This email is already registered. Please use a different email or sign in.');
      }
    }
    
    // Check if phone already exists (if provided)
    if (phone) {
      const { data: existingPhone } = await supabase
        .from('profiles')
        .select('phone')
        .eq('phone', phone)
        .maybeSingle();
      
      if (existingPhone) {
        throw new Error('This phone number is already registered. Please use a different number or sign in.');
      }
    }
    
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: {
        data: {
          username: username,
          role: role,
        }
      }
    });
    
    if (error) {
      console.error('Supabase auth signup error:', error);
      // Provide better error messages
      if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
        throw new Error('This account already exists. Please sign in instead.');
      } else if (error.message?.includes('Password')) {
        throw new Error('Password must be at least 6 characters long.');
      } else if (error.message?.includes('User already registered')) {
        throw new Error('This account already exists. Please sign in instead.');
      }
      throw new Error(error.message || 'Failed to create account. Please try again.');
    }
    
    if (data.user) {
      // Wait for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update profile with all information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          username: username,
          role: role,
          email: email || null,
          phone: phone || null,
          contact_no: phone || null,
          referred_by: referredBy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id);
      
      if (profileError) {
        console.error('Profile update error:', profileError);
        // Check if it's a unique constraint violation on email or phone
        if (profileError.message?.includes('unique') || profileError.code === '23505') {
          if (profileError.message?.includes('email')) {
            throw new Error('This email is already in use. Please use a different email.');
          } else if (profileError.message?.includes('phone')) {
            throw new Error('This phone number is already in use. Please use a different number.');
          } else {
            throw new Error('This email or phone number is already in use. Please try different values.');
          }
        }
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      if (error.message?.includes('not found')) {
        throw new Error('No account found with this email address.');
      }
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      if (error.message?.includes('same as the old password')) {
        throw new Error('New password must be different from your current password.');
      } else if (error.message?.includes('Password')) {
        throw new Error('Password must be at least 6 characters long.');
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signIn, 
      signInWithGoogle, 
      signUp, 
      signOut, 
      refreshProfile,
      resetPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
