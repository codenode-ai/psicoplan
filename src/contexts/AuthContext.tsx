
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/database.types';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, nomeCompleto: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (userParam?: User | null) => {
    const currentUser = userParam || user;
    
    if (!currentUser) {
      console.log('No user found, clearing profile');
      setUserProfile(null);
      return;
    }

    try {
      console.log('Refreshing profile for user:', currentUser.id);
      
      // Verifica se a sessão ainda é válida
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession || !currentSession.access_token) {
        console.warn('No valid session found, skipping profile refresh');
        return;
      }
      
      console.log('Session valid, fetching profile...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Se for erro de permissão, pode ser problema de timing
        if (error.code === 'PGRST301' || error.message.includes('permission')) {
          console.log('Permission error, retrying after delay...');
          setTimeout(() => {
            refreshProfile();
          }, 2000);
          return;
        }
        
        throw error;
      }
      
      console.log('User profile loaded successfully:', data);
      setUserProfile(data);
    } catch (error: any) {
      console.error('Error in refreshProfile:', error);
      
      // Retry apenas se não for um erro definitivo
      if (error.code !== '42501' && !error.message.includes('not found')) {
        console.log('Retrying profile fetch in 3 seconds...');
        setTimeout(() => {
          refreshProfile();
        }, 3000);
      } else {
        console.error('Definitive error, not retrying:', error);
        setUserProfile(null);
      }
    }
  };

  const signUp = async (email: string, password: string, nomeCompleto: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome_completo: nomeCompleto
          }
        }
      });

      if (!error && data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar sua conta e fazer login.",
          duration: 6000,
        });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email não confirmado",
            description: "Por favor, verifique seu email e clique no link de confirmação antes de fazer login.",
            variant: "destructive",
            duration: 6000,
          });
        }
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const cleanupAuthState = () => {
    // Limpa todos os tokens de auth do localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpa sessionStorage se existir
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  };

  const signOut = async () => {
    try {
      // Limpa estado primeiro
      cleanupAuthState();
      
      // Tenta fazer logout global
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Global signout failed, continuing with local cleanup');
      }
      
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      // Force page reload para garantir estado limpo
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      // Mesmo com erro, limpa o estado local
      cleanupAuthState();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      toast({
        title: "Erro ao sair",
        description: "Erro no logout, mas estado foi limpo.",
        variant: "destructive"
      });
      
      // Força redirect mesmo com erro
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && event !== 'SIGNED_OUT') {
          // Delay maior para garantir que o token esteja completamente disponível
          console.log('User authenticated, scheduling profile load...');
          setTimeout(async () => {
            console.log('Loading profile after auth state change...');
            await refreshProfile(session.user);
            
            // Check subscription status after profile is loaded
            try {
              await supabase.functions.invoke('check-subscription', {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              });
            } catch (error) {
              console.log('Failed to check subscription on auth change:', error);
            }
          }, 500);
        } else {
          console.log('No user or signed out, clearing profile');
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Verifica sessão existente na inicialização
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('User found on initialization, scheduling profile load...');
        // Delay maior na inicialização para garantir que tudo esteja pronto
        setTimeout(() => {
          console.log('Loading profile on initialization...');
          refreshProfile(session.user);
        }, 800);
      } else {
        console.log('No user on initialization');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
