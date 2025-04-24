
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";

interface Profile {
  id: string;
  name: string | null;
  role: "admin" | "atendente";
  trial_end_date: string | null;
  is_subscribed: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: "admin" | "atendente") => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, "id">>) => Promise<void>;
  isSubscriptionActive: boolean;
  isInTrialPeriod: boolean;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isInTrialPeriod = profile?.trial_end_date ? new Date() < new Date(profile.trial_end_date) : false;
  const isSubscriptionActive = profile?.is_subscribed || false;

  // Function to fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data as Profile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Use setTimeout to prevent potential deadlocks
          setTimeout(async () => {
            const userProfile = await fetchProfile(newSession.user.id);
            setProfile(userProfile);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    const getSession = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        
        if (existingSession?.user) {
          const userProfile = await fetchProfile(existingSession.user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      sonnerToast.success("Login realizado com sucesso", {
        description: "Bem-vindo de volta ao PetGestor!"
      });
    } catch (error: any) {
      console.error("Sign in error:", error);
      sonnerToast.error("Erro no login", {
        description: error.message || "Verifique seu e-mail e senha."
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: "admin" | "atendente"): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            role: role,
          }
        }
      });
      
      if (error) throw error;
      
      sonnerToast.success("Conta criada com sucesso", {
        description: "Bem-vindo ao PetGestor!"
      });
    } catch (error: any) {
      console.error("Sign up error:", error);
      sonnerToast.error("Erro no cadastro", {
        description: error.message || "Verifique os dados informados."
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      sonnerToast.success("Logout realizado", {
        description: "Você saiu da sua conta com sucesso."
      });
    } catch (error: any) {
      console.error("Sign out error:", error);
      sonnerToast.error("Erro ao sair", {
        description: error.message || "Ocorreu um erro ao fazer logout."
      });
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/UpdatePassword`, // substitua com a URL da sua página de redefinição
      });
  
      if (error) throw error;
  
      sonnerToast.success("Verifique seu e-mail", {
        description: "Enviamos um link para redefinir sua senha.",
      });
    } catch (error: any) {
      console.error("Erro ao solicitar redefinição de senha:", error);
      sonnerToast.error("Erro ao redefinir senha", {
        description: error.message || "Não foi possível enviar o e-mail de recuperação.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Omit<Profile, "id">>): Promise<void> => {
    if (!user) throw new Error("No user logged in");
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Refresh profile after update
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);
      
      sonnerToast.success("Perfil atualizado", {
        description: "Suas informações foram atualizadas com sucesso."
      });
    } catch (error: any) {
      console.error("Update profile error:", error);
      sonnerToast.error("Erro ao atualizar perfil", {
        description: error.message || "Ocorreu um erro ao atualizar suas informações."
      });
      throw error;
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isSubscriptionActive,
    isInTrialPeriod,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
