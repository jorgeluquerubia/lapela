'use client';

import { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  username: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refreshUserProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error("Error fetching profile for auth context:", error);
      setProfile(null);
    } else {
      setProfile(data);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      const initialUser = initialSession?.user ?? null;
      
      setSession(initialSession);
      setUser(initialUser);
      await fetchUserProfile(initialUser);
      
      // 2. Set loading to false ONLY after the initial check is complete
      setLoading(false);

      // 3. Set up a listener for future auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        const newUser = newSession?.user ?? null;
        setSession(newSession);
        setUser(newUser);
        await fetchUserProfile(newUser);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, [fetchUserProfile]);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
