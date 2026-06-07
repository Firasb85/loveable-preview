import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type Role = 'ADMIN' | 'MANAGER' | 'USER' | 'CEO';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: Role;
  permissions: string[];
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>('USER'); // Default fallback
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      extractRbac(session?.user);
      setIsLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      extractRbac(session?.user);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const extractRbac = (user: User | undefined | null) => {
    if (!user) {
      setRole('USER');
      setPermissions([]);
      return;
    }
    // Extract role from Supabase user metadata or JWT claims
    const userRole = (user.user_metadata?.role || 'USER') as Role;
    setRole(userRole);
    
    // Assign base permissions dynamically
    const basePermissions = ['read:dashboard'];
    if (userRole === 'ADMIN' || userRole === 'CEO') basePermissions.push('manage:users', 'read:executive');
    setPermissions(basePermissions);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, permissions, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider. Ensure your app tree is wrapped.');
  }
  return context;
};
