import { supabase } from "@/integrations/supabase/client";

type MatriculaStatus = "ativa" | "pendente" | "cancelada" | "concluida";

export const matriculasService = {
  /** Buscar matrículas com dados ricos para Tabela e Detalhes */
  async fetchAll() {
    const { data, error } = await supabase
      .from("matriculas")
      .select(`
        id,
        status,
        data_inicio,
        created_at,
        aluno:alunos(
          id,
          nome_completo,
          cpf,
          rg,
          telefone,
          data_nascimento,
          foto_url,
          responsavel:profiles!alunos_responsavel_id_fkey(
            id,
            nome_completo,
            telefone
          ),
          anamneses(
            is_pne,
            pne_cid,
            alergias,
            doenca_cronica
          )
        ),
        turma:turmas(
          id,
          nome,
          horario,
          dias_semana,
          atividade:atividades(
            id,
            nome
          )
        ),
        pagamentos(id, status)
      `)
      .order("data_inicio", { ascending: false });

    if (error) throw error;
    return data;
  },

  /** Atualizar status da matrícula */
  async updateStatus(id: string, status: MatriculaStatus) {
    const { error } = await supabase
      .from("matriculas")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
  },
  
  /** Deletar/Cancelar matrícula */
  async delete(id: string) {
    const { error } = await supabase.from("matriculas").delete().eq("id", id);
    if (error) throw error;
  }
};
