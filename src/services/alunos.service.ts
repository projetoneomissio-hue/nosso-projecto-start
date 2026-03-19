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
        endereco?: string;
        responsavel_id?: string;
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
            responsavel_id: payload.responsavel_id,
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
            endereco?: string;
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

    /** Deletar vários alunos por IDs */
    async deleteMany(ids: string[]) {
        if (ids.length === 0) return;
        const { error } = await supabase.from("alunos").delete().in("id", ids);
        if (error) throw error;
    },

    /** Deletar TODOS os alunos (perigoso!) */
    async deleteAll() {
        const { error } = await supabase.from("alunos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
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

    /** 
     * Busca global por duplicatas (CPF, Email ou Nome+DataNasc) 
     * Verifica em perfis e alunos.
     */
    async checkGlobalDuplicate(params: { 
        cpf?: string; 
        email?: string; 
        nome?: string; 
        dataNascimento?: string 
    }) {
        const results = {
            profile: null as any,
            aluno: null as any,
        };

        // 1. Check by CPF (Strongest)
        if (params.cpf) {
            const cleanCpf = unmaskCPF(params.cpf);
            
            const { data: profile } = await (supabase
                .from("profiles")
                .select("id, nome_completo, email")
                .eq("cpf" as any, cleanCpf)
                .maybeSingle() as any);
            
            if (profile) results.profile = profile;

            const { data: aluno } = await (supabase
                .from("alunos")
                .select("id, nome_completo, responsavel_id")
                .eq("cpf", cleanCpf)
                .maybeSingle() as any);
            
            if (aluno) results.aluno = aluno;
        }

        // 2. Check by Email
        if (params.email && !results.profile) {
            const { data: profileByEmail } = await (supabase
                .from("profiles")
                .select("id, nome_completo, email")
                .eq("email", params.email)
                .maybeSingle() as any);
            
            if (profileByEmail) results.profile = profileByEmail;
        }

        // 3. Fuzzy Check (Name + DOB) - Fallback for records without CPF
        if (params.nome && params.dataNascimento) {
            if (!results.profile) {
                const { data: fuzzyProfile } = await (supabase
                    .from("profiles")
                    .select("id, nome_completo, email")
                    .eq("nome_completo", params.nome)
                    // Note: If profiles don't have birthdate, we might need to skip or use only name+id
                    .maybeSingle() as any);
                
                // Only mark as duplicate if name matches exactly and we don't have a newer record
                if (fuzzyProfile) results.profile = fuzzyProfile;
            }

            if (!results.aluno) {
                const { data: fuzzyAluno } = await (supabase
                    .from("alunos")
                    .select("id, nome_completo, responsavel_id")
                    .eq("nome_completo", params.nome)
                    .eq("data_nascimento", params.dataNascimento)
                    .maybeSingle() as any);
                
                if (fuzzyAluno) results.aluno = fuzzyAluno;
            }
        }

        return results;
    },

    /**
     * Busca alunos no banco (apenas para secretaria/direção)
     */
    async searchStudents(query: string) {
        if (!query || query.length < 3) return [];

        const { data, error } = await supabase
            .from("alunos")
            .select("id, nome_completo, data_nascimento, cpf")
            .ilike("nome_completo", `%${query}%`)
            .order("nome_completo")
            .limit(10);
        
        if (error) throw error;
        return data || [];
    },

    /** 
     * Processa um convite aceito, criando os alunos listados no metadata 
     */
    async processInvitationData(token: string, userId: string) {
        // 1. Fetch invitation metadata
        const { data: invite, error: inviteError } = await (supabase
            .from("invitations")
            .select("metadata, email")
            .eq("token", token)
            .maybeSingle() as any);
        
        if (inviteError || !invite) return;

        const metadata = invite.metadata as any;
        if (!metadata) return;

        // 2. Update Profile with birthdate if provided
        if (metadata.responsavel_data_nascimento) {
            await (supabase
                .from("profiles")
                .update({ data_nascimento: metadata.responsavel_data_nascimento } as any)
                .eq("id", userId) as any);
        }

        // 3. Handle Self-Enrollment (Adult Students)
        if (metadata.is_self) {
            // Check if already exists as aluno
            const { data: existing } = await supabase
                .from("alunos")
                .select("id")
                .eq("responsavel_id", userId)
                .maybeSingle();

            if (!existing) {
                await supabase.from("alunos").insert({
                    nome_completo: metadata.responsavel_nome,
                    cpf: unmaskCPF(metadata.responsavel_cpf),
                    data_nascimento: metadata.responsavel_data_nascimento,
                    responsavel_id: userId,
                    status: "ativo"
                });
            }
        }

        // 4. Handle Existing Students (Retroactive Link)
        if (metadata.existing_student_ids && Array.isArray(metadata.existing_student_ids)) {
            for (const alunoId of metadata.existing_student_ids) {
                await supabase
                    .from("alunos")
                    .update({ responsavel_id: userId })
                    .eq("id", alunoId);
            }
        }

        // 5. Handle New Students
        if (metadata.alunos && Array.isArray(metadata.alunos)) {
            for (const alunoData of metadata.alunos) {
                // If it was already linked above, skip duplicate creation if same name
                // (Though the UI should distinguish them)
                await supabase.from("alunos").insert({
                    nome_completo: alunoData.nome,
                    data_nascimento: alunoData.data_nascimento,
                    cpf: unmaskCPF(alunoData.cpf),
                    responsavel_id: userId,
                    status: "ativo"
                });
            }
        }
    },
};
