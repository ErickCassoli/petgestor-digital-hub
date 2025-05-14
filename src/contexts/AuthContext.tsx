import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
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
  resetPassword: (email: string) => Promise<void>;
  isSubscriptionActive: boolean;
  isInTrialPeriod: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const isInTrialPeriod = profile?.trial_end_date
    ? new Date() < new Date(profile.trial_end_date)
    : false;
  const isSubscriptionActive = profile?.is_subscribed || false;

  // Busca perfil no Supabase
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data as Profile;
  };

  // Exposto para forçar re-fetch do perfil
  const refreshProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    const updated = await fetchProfile(user.id);
    setProfile(updated);
    setLoading(false);
  };

  // Monitora sessão e carrega perfil
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          fetchProfile(newSession.user.id).then((p) => {
            setProfile(p);
            setLoading(false);
          });
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id).then((p) => {
          setProfile(p);
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      sonnerToast.success("Login realizado com sucesso", {
        description: "Bem-vindo de volta ao PetGestor!",
      });

      // Atualiza sessão e perfil
      const {
        data: { session: newSession },
      } = await supabase.auth.getSession();
      if (!newSession?.user) return;

      const userProfile = await fetchProfile(newSession.user.id);
      setProfile(userProfile);

      // Redireciona conforme assinatura/trial
      if (
        userProfile?.is_subscribed ||
        (userProfile?.trial_end_date && new Date() < new Date(userProfile.trial_end_date))
      ) {
        navigate("/dashboard");
      } else {
        navigate("/expired");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      sonnerToast.error("Erro no login", {
        description: error.message || "Verifique seu e-mail e senha.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: "admin" | "atendente") => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/ConfirmedEmail`,
          data: { role },
        },
      });
      if (error) throw error;

      sonnerToast.success("Conta criada com sucesso", {
        description: "Bem-vindo ao PetGestor!",
      });
    } catch (error: any) {
      console.error("Sign up error:", error);
      sonnerToast.error("Erro no cadastro", {
        description: error.message || "Verifique os dados informados.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      sonnerToast.success("Logout realizado", {
        description: "Você saiu da sua conta com sucesso.",
      });
      navigate("/");
    } catch (error: any) {
      console.error("Sign out error:", error);
      sonnerToast.error("Erro ao sair", {
        description: error.message || "Ocorreu um erro ao fazer logout.",
      });
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/UpdatePassword`,
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

  const updateProfile = async (updates: Partial<Omit<Profile, "id">>) => {
    if (!user) throw new Error("No user logged in");
    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
      if (error) throw error;

      const updated = await fetchProfile(user.id);
      setProfile(updated);

      sonnerToast.success("Perfil atualizado", {
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Update profile error:", error);
      sonnerToast.error("Erro ao atualizar perfil", {
        description: error.message || "Ocorreu um erro ao atualizar suas informações.",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        resetPassword,
        isSubscriptionActive,
        isInTrialPeriod,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
