
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";

// We will replace these with the actual environment variables when Supabase is connected
const supabaseUrl = "https://your-supabase-url.supabase.co";
const supabaseAnonKey = "your-supabase-anon-key";

interface User {
  id: string;
  email: string;
  role: "admin" | "atendente";
  trialEndDate: Date | null;
}

interface AuthContextType {
  user: User | null;
  supabase: SupabaseClient;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: "admin" | "atendente") => Promise<void>;
  signOut: () => Promise<void>;
  isSubscriptionActive: boolean;
  isInTrialPeriod: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient(supabaseUrl, supabaseAnonKey));
  const { toast } = useToast();

  // Define a mock date for trial end (In actual implementation this would come from Supabase)
  const mockTrialEndDate = new Date();
  mockTrialEndDate.setDate(mockTrialEndDate.getDate() + 7);

  const isInTrialPeriod = user?.trialEndDate ? new Date() < user.trialEndDate : false;
  const isSubscriptionActive = true; // This would be determined based on subscription status from Supabase/Stripe

  useEffect(() => {
    // This is a mock implementation. Will be replaced when Supabase is connected
    const checkUser = async () => {
      // Checking for a stored session in localStorage as a mock
      const storedUser = localStorage.getItem("petgestor_user");
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            ...parsedUser,
            trialEndDate: parsedUser.trialEndDate ? new Date(parsedUser.trialEndDate) : mockTrialEndDate
          });
        } catch (error) {
          console.error("Error parsing stored user:", error);
          localStorage.removeItem("petgestor_user");
        }
      }
      
      setLoading(false);
    };

    checkUser();
    
    // Setup auth state listener (would be replaced with Supabase listener)
    // const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    //   // Handle auth state changes
    // });
    
    // Return cleanup function for the listener
    // return () => {
    //   authListener.subscription.unsubscribe();
    // };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // This is a mock implementation. Will be replaced with actual Supabase auth
      // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      // Mock validation
      if (email && password) {
        // Mock user for demonstration
        const mockUser = {
          id: "mock-user-id",
          email: email,
          role: "admin" as const,
          trialEndDate: mockTrialEndDate.toISOString()
        };
        
        localStorage.setItem("petgestor_user", JSON.stringify(mockUser));
        
        setUser({
          ...mockUser,
          trialEndDate: mockTrialEndDate
        });
        
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo de volta ao PetGestor!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: "Verifique seu e-mail e senha.",
        });
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: "Ocorreu um erro ao fazer login. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: "admin" | "atendente") => {
    setLoading(true);
    try {
      // This is a mock implementation. Will be replaced with actual Supabase auth
      // const { data, error } = await supabase.auth.signUp({ email, password });
      
      // Mock validation
      if (email && password) {
        // Mock user for demonstration
        const mockUser = {
          id: "mock-user-id",
          email: email,
          role: role,
          trialEndDate: mockTrialEndDate.toISOString()
        };
        
        localStorage.setItem("petgestor_user", JSON.stringify(mockUser));
        
        setUser({
          ...mockUser,
          trialEndDate: mockTrialEndDate
        });
        
        toast({
          title: "Conta criada com sucesso",
          description: "Bem-vindo ao PetGestor!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: "Verifique os dados informados.",
        });
      }
    } catch (error) {
      console.error("Sign up error:", error);
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao criar sua conta. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // This is a mock implementation. Will be replaced with actual Supabase auth
      // await supabase.auth.signOut();
      
      localStorage.removeItem("petgestor_user");
      setUser(null);
      
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta com sucesso.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const value = {
    user,
    supabase,
    loading,
    signIn,
    signUp,
    signOut,
    isSubscriptionActive,
    isInTrialPeriod,
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
