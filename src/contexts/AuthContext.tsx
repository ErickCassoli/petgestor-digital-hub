import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";

interface Profile {
  id: string;
  name: string | null;
  role: 'admin' | 'atendente';
  plan: 'free' | 'pro';
  plan_started_at: string | null;
  stripe_customer_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, "id">>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isSubscriptionActive: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const isSubscriptionActive = profile?.plan === 'pro';

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    if (!data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name ?? null,
      role: (data.role as Profile['role']) ?? 'admin',
      plan: data.plan === 'pro' ? 'pro' : 'free',
      plan_started_at: data.plan_started_at ?? null,
      stripe_customer_id: data.stripe_customer_id ?? null,
    } satisfies Profile;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const updated = await fetchProfile(user.id);
    setProfile(updated);
    setLoading(false);
  }, [user, fetchProfile]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
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
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        // 1) Autentica
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        // 2) Chama a função que atualiza status de assinatura
        const { error: fnError } = await supabase.functions.invoke(
          "check-subscription-status"
        );
        if (fnError) console.error("Erro ao atualizar assinatura:", fnError);

        // 3) Recupera a nova sessão
        const {
          data: { session: newSession },
        } = await supabase.auth.getSession();
        if (!newSession?.user) return;

        // 4) Busca o profile já com status atualizado
        const userProfile = await fetchProfile(newSession.user.id);
        setProfile(userProfile);

        sonnerToast.success("Login realizado com sucesso", {
          description: "Bem-vindo de volta ao PetGestor!",
        });

        navigate("/dashboard");
      } catch (err: any) {
        console.error("Sign in error:", err);
        sonnerToast.error("Erro no login", {
          description: err.message || "Verifique seu e-mail e senha.",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile, navigate]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${APP_URL}/ConfirmedEmail`,
            data: { role: 'admin', name: email },
          },
        });
        if (error) throw error;
        sonnerToast.success("Conta criada com sucesso", {
          description: "Confirme seu e-mail para ativar sua conta.",
        });
      } catch (err: any) {
        console.error("Sign up error:", err);
        sonnerToast.error("Erro no cadastro", {
          description: err.message || "Verifique os dados informados.",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      sonnerToast.success("Logout realizado", {
        description: "Você saiu da sua conta com sucesso.",
      });
      navigate("/login", { replace: true });
    } catch (err: any) {
      console.error("Sign out error:", err);
      sonnerToast.error("Erro ao sair", {
        description: err.message || "Ocorreu um erro ao fazer logout.",
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${APP_URL}/UpdatePassword`,
      });
      if (error) throw error;
      sonnerToast.success("Verifique seu e-mail", {
        description: "Enviamos um link para redefinir sua senha.",
      });
    } catch (err: any) {
      console.error("Reset password error:", err);
      sonnerToast.error("Erro ao redefinir senha", {
        description: err.message || "Não foi possível enviar o e-mail de recuperação.",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Omit<Profile, "id">>) => {
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
      } catch (err: any) {
        console.error("Update profile error:", err);
        sonnerToast.error("Erro ao atualizar perfil", {
          description: err.message || "Ocorreu um erro ao atualizar suas informações.",
        });
        throw err;
      }
    },
    [user, fetchProfile]
  );

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














