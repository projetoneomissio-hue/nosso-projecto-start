import { supabase } from "@/integrations/supabase/client";

export const turmasService = {
    /** Buscar todas as turmas com atividade, professor e contagem de matrículas */
    async fetchAll() {
        const { data, error } = await supabase
            .from("turmas")
            .select(`
        *,
        atividade:atividades(nome),
        professor:professores(id, user:profiles(nome_completo)),
        matriculas(count)
      `)
            .order("nome");

        if (error) throw error;
        return data;
    },

    /** Criar nova turma */
    async create(payload: {
        nome: string;
        atividade_id: string;
        professor_id: string | null;
        horario: string;
        dias_semana: string[];
        capacidade_maxima: number;
        ativa: boolean;
    }) {
        const { error } = await supabase.from("turmas").insert([payload]);
        if (error) throw error;
    },

    /** Atualizar turma existente */
    async update(
        id: string,
        payload: {
            nome: string;
            atividade_id: string;
            professor_id: string | null;
            horario: string;
            dias_semana: string[];
            capacidade_maxima: number;
            ativa: boolean;
        }
    ) {
        const { error } = await supabase.from("turmas").update(payload).eq("id", id);
        if (error) throw error;
    },

    /** Deletar turma */
    async delete(id: string) {
        const { error } = await supabase.from("turmas").delete().eq("id", id);
        if (error) throw error;
    },

    /** Buscar atividades ativas (para selects) */
    async fetchAtividades() {
        const { data, error } = await supabase
            .from("atividades")
            .select("id, nome")
            .eq("ativa", true)
            .order("nome");

        if (error) throw error;
        return data;
    },

    /** Buscar professores ativos (para selects) */
    async fetchProfessores() {
        const { data, error } = await supabase
            .from("professores")
            .select("id, user:profiles(nome_completo)")
            .eq("ativo", true);

        if (error) throw error;
        return data;
    },

    /** Buscar alunos de uma turma (para PDF, Avaliações e Visualização em Grade) */
    async fetchAlunosDaTurma(turmaId: string) {
        const { data, error } = await supabase
            .from("matriculas")
            .select(`
                id,
                status,
                aluno:alunos(
                    id,
                    nome_completo,
                    foto_url,
                    cpf,
                    rg,
                    telefone,
                    data_nascimento,
                    responsavel:profiles!alunos_responsavel_id_fkey(nome_completo),
                    anamneses(is_pne, pne_cid, doenca_cronica, alergias, laudo_url)
                )
            `)
            .eq("turma_id", turmaId)
            .eq("status", "ativa");

        if (error) throw error;
        return data || [];
    },

    /** Buscar avaliações de uma turma */
    async fetchAvaliacoes(turmaId: string) {
        const { data, error } = await supabase
            .from("avaliacoes")
            .select(`
                *,
                notas (*)
            `)
            .eq("turma_id", turmaId)
            .order("data_realizacao");

        if (error) throw error;
        return data;
    },

    /** Upsert de nota */
    async upsertNota(payload: {
        avaliacao_id: string;
        aluno_id: string;
        valor_numerico?: number;
        conceito?: string;
        observacoes?: string;
    }) {
        const { error } = await supabase
            .from("notas")
            .upsert([payload], { onConflict: "avaliacao_id,aluno_id" });

        if (error) throw error;
    },

    /** Criar avaliação */
    async createAvaliacao(payload: {
        turma_id: string;
        titulo: string;
        tipo: string;
        bimestre: number;
        peso: number;
        data_realizacao: string;
    }) {
        const { error } = await supabase.from("avaliacoes").insert([payload]);
        if (error) throw error;
    },
};
