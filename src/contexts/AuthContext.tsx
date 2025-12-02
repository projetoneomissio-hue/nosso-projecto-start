import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer fetching user data to avoid blocking
          setTimeout(async () => {
            await fetchUserData(session.user);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await fetchUserData(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome_completo")
        .eq("id", supabaseUser.id)
        .single();

      // Fetch role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", supabaseUser.id)
        .single();

      if (profile && roleData) {
        setUser({
          id: supabaseUser.id,
          name: profile.nome_completo,
          email: supabaseUser.email || "",
          role: roleData.role as UserRole,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

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
      
      // AQUI ESTÁ A CORREÇÃO:
      // Passamos os dados como metadados (options.data).
      // O Trigger no banco de dados lerá 'nome_completo' e 'invite_token' e fará as inserções.
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
      
      // OBS: Não fazemos mais nenhum 'supabase.from(...).insert()' aqui.
      // Isso evita o erro de permissão, pois o usuário ainda não está logado/confirmado.

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
