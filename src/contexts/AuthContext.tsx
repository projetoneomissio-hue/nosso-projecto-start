import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type UserRole = "direcao" | "coordenacao" | "professor" | "responsavel";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, name: string, role: UserRole, inviteToken?: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setIsAuthLoading(false);

        if (event === 'SIGNED_OUT') {
          queryClient.clear();
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: user, isLoading: isProfileLoading } = useQuery({
    queryKey: ["user-profile", session?.user?.id],
    enabled: !!session?.user,
    queryFn: async (): Promise<User | null> => {
      const supabaseUser = session!.user;

      try {
        // Fetch profile and role in parallel
        const [profileRes, roleRes] = await Promise.all([
          supabase.from("profiles").select("nome_completo").eq("id", supabaseUser.id).single(),
          supabase.from("user_roles").select("role").eq("user_id", supabaseUser.id).single()
        ]);

        if (profileRes.error || roleRes.error) {
          console.error("Erro ao buscar dados do usuário:", profileRes.error || roleRes.error);
          return null;
        }

        return {
          id: supabaseUser.id,
          name: profileRes.data.nome_completo,
          email: supabaseUser.email || "",
          role: roleRes.data.role as UserRole,
        };
      } catch (error) {
        console.error("Error in user queryFn:", error);
        return null;
      }
    },
    staleTime: Infinity, // Profile data doesn't change often
  });

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole, inviteToken?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome_completo: name,
            invite_token: inviteToken || null,
          },
        },
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        session,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        loading: isAuthLoading || (!!session?.user && isProfileLoading),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
