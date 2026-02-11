import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole, AuthUser } from '@/types/auth.types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string): Promise<void> => {
    try {
      // Fetch profile and role in parallel (using role_id + roles table)
      const [profileResult, roleResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role_id, roles!inner(name)').eq('user_id', userId).limit(1).maybeSingle()
      ]);
      
      if (profileResult.data) {
        setProfile(profileResult.data as Profile);
      }

      if (roleResult.data) {
        // Get role name from the joined roles table
        const roleName = (roleResult.data.roles as any)?.name as AppRole;
        setRole(roleName || null);
      } else {
        // Set a default role if none found to prevent indefinite loading
        setRole(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Ensure role is set even on error to prevent indefinite loading
      setRole(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let hasInitialized = false;

    // Set up auth state listener FIRST - this is the single source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to avoid deadlock
          setTimeout(() => {
            if (isMounted) {
              fetchUserData(session.user.id).finally(() => {
                if (isMounted) {
                  hasInitialized = true;
                  setIsLoading(false);
                }
              });
            }
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          hasInitialized = true;
          setIsLoading(false);
        }
      }
    );

    // Check for existing session - triggers onAuthStateChange if session exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      // If no session and onAuthStateChange hasn't fired yet, set loading to false
      if (!session && isMounted && !hasInitialized) {
        setTimeout(() => {
          if (isMounted && !hasInitialized) {
            hasInitialized = true;
            setIsLoading(false);
          }
        }, 100);
      }
    });

    // Safety timeout - ensure we don't get stuck in loading state forever
    const safetyTimeout = setTimeout(() => {
      if (isMounted && !hasInitialized) {
        console.warn('Auth initialization timed out, forcing loading complete');
        hasInitialized = true;
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    isLoading,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
