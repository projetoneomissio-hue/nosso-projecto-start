import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useRoleBasedData = () => {
  const { user } = useAuth();

  // Buscar atividades baseado no role
  const { data: atividades = [], isLoading: loadingAtividades } = useQuery({
    queryKey: ["atividades", user?.role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Buscar turmas baseado no role
  const { data: turmas = [], isLoading: loadingTurmas } = useQuery({
    queryKey: ["turmas", user?.role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas")
        .select(`
          *,
          atividades (nome),
          professores (
            user_id,
            profiles (nome_completo)
          )
        `)
        .order("nome");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Buscar alunos baseado no role
  const { data: alunos = [], isLoading: loadingAlunos } = useQuery({
    queryKey: ["alunos", user?.role],
    queryFn: async () => {
      // Para responsáveis, usar alunos_secure view que protege CPF
      if (user?.role === "responsavel") {
        const { data, error } = await supabase
          .from("alunos_secure")
          .select("*")
          .order("nome_completo");
        if (error) throw error;
        return data || [];
      } else {
        const { data, error } = await supabase
          .from("alunos")
          .select("*")
          .order("nome_completo");
        if (error) throw error;
        return data || [];
      }
    },
    enabled: !!user,
  });

  // Buscar matrículas baseado no role
  const { data: matriculas = [], isLoading: loadingMatriculas } = useQuery({
    queryKey: ["matriculas", user?.role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matriculas")
        .select(`
          *,
          alunos (nome_completo),
          turmas (
            nome,
            atividades (nome)
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Buscar pagamentos baseado no role
  const { data: pagamentos = [], isLoading: loadingPagamentos } = useQuery({
    queryKey: ["pagamentos", user?.role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos")
        .select(`
          *,
          matriculas (
            alunos (nome_completo),
            turmas (
              nome,
              atividades (nome)
            )
          )
        `)
        .order("data_vencimento", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  return {
    atividades,
    turmas,
    alunos,
    matriculas,
    pagamentos,
    isLoading: loadingAtividades || loadingTurmas || loadingAlunos || loadingMatriculas || loadingPagamentos,
  };
};
