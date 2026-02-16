import { supabase } from "@/integrations/supabase/client";
import { unmaskCPF, validateCPF } from "@/utils/cpf";

export const alunosService = {
    /** Buscar todos os alunos com matrículas */
    async fetchAll() {
        const { data, error } = await supabase
            .from("alunos")
            .select(`
        *,
        matriculas (
          status,
          turma:turmas (nome)
        )
      `)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
    },

    /** Criar novo aluno */
    async create(payload: {
        nome: string;
        data_nascimento: string;
        cpf: string;
        telefone: string;
        endereco: string;
        alergias?: string;
        medicamentos?: string;
        observacoes?: string;
        foto_url?: string;
    }) {
        const cleanCpf = unmaskCPF(payload.cpf);

        if (cleanCpf && cleanCpf.length > 0) {
            if (cleanCpf.length !== 11 || !validateCPF(cleanCpf)) {
                throw new Error("CPF inválido.");
            }
            await this._checkCpfDuplicado(cleanCpf);
        }

        const { error } = await supabase.from("alunos").insert({
            nome_completo: payload.nome,
            data_nascimento: payload.data_nascimento,
            cpf: cleanCpf || null,
            telefone: payload.telefone || null,
            endereco: payload.endereco || null,
            alergias: payload.alergias || null,
            medicamentos: payload.medicamentos || null,
            observacoes: payload.observacoes || null,
            foto_url: payload.foto_url || null,
        } as any);

        if (error) throw error;
    },

    /** Atualizar aluno existente */
    async update(
        id: string,
        payload: {
            nome: string;
            data_nascimento: string;
            cpf: string;
            telefone: string;
            endereco: string;
            alergias?: string;
            medicamentos?: string;
            observacoes?: string;
            foto_url?: string;
        }
    ) {
        const cleanCpf = unmaskCPF(payload.cpf);

        if (cleanCpf && cleanCpf.length > 0) {
            if (cleanCpf.length !== 11 || !validateCPF(cleanCpf)) {
                throw new Error("CPF inválido.");
            }
            await this._checkCpfDuplicado(cleanCpf, id);
        }

        const { error } = await supabase
            .from("alunos")
            .update({
                nome_completo: payload.nome,
                data_nascimento: payload.data_nascimento,
                cpf: cleanCpf || null,
                telefone: payload.telefone || null,
                endereco: payload.endereco || null,
                alergias: payload.alergias || null,
                medicamentos: payload.medicamentos || null,
                observacoes: payload.observacoes || null,
                foto_url: payload.foto_url || null,
            } as any)
            .eq("id", id);

        if (error) throw error;
    },

    /** Deletar aluno */
    async delete(id: string) {
        const { error } = await supabase.from("alunos").delete().eq("id", id);
        if (error) throw error;
    },

    /** Verifica CPF duplicado (exclui o próprio ID se for edição) */
    async _checkCpfDuplicado(cpf: string, excludeId?: string) {
        let query = supabase.from("alunos").select("id").eq("cpf", cpf);

        if (excludeId) {
            query = query.neq("id", excludeId);
        }

        const { data: existing, error } = await query.maybeSingle();
        if (error) throw error;
        if (existing) throw new Error("CPF já cadastrado para outro aluno.");
    },
};
