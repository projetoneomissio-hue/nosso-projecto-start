import { supabase } from "@/integrations/supabase/client";

type MatriculaStatus = "ativa" | "pendente" | "cancelada" | "concluida";

export const matriculasService = {
    /** Buscar matrículas com filtros opcionais */
    async fetchAll(filters?: { status?: string; turmaId?: string }) {
        let query = supabase
            .from("matriculas")
            .select(`
        *,
        aluno:alunos(nome_completo, cpf),
        turma:turmas(nome, atividade:atividades(nome))
      `)
            .order("created_at", { ascending: false });

        if (filters?.status) query = query.eq("status", filters.status as MatriculaStatus);
        if (filters?.turmaId) query = query.eq("turma_id", filters.turmaId);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    /** Criar nova matrícula */
    async create(payload: { aluno_id: string; turma_id: string; status?: MatriculaStatus }) {
        const { error } = await supabase.from("matriculas").insert({
            aluno_id: payload.aluno_id,
            turma_id: payload.turma_id,
            data_inicio: new Date().toISOString().split("T")[0],
            status: payload.status || "pendente",
        });
        if (error) throw error;
    },

    /** Atualizar status da matrícula */
    async updateStatus(id: string, status: MatriculaStatus) {
        const { error } = await supabase
            .from("matriculas")
            .update({ status })
            .eq("id", id);
        if (error) throw error;
    },
};
