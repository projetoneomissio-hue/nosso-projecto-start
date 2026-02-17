import { supabase } from "@/integrations/supabase/client";

export type ContactType = 'ligacao' | 'whatsapp' | 'email' | 'reuniao' | 'cobranca' | 'outro';

export interface CreateContactParams {
    aluno_id: string;
    tipo: ContactType;
    descricao: string;
    data_contato?: string;
}

export const contactsService = {
    async listByAluno(alunoId: string) {
        const { data, error } = await supabase
            .from("contact_logs")
            .select(`
                *,
                autor:profiles(nome_completo)
            `)
            .eq("aluno_id", alunoId)
            .order("data_contato", { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(params: CreateContactParams) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { data, error } = await supabase
            .from("contact_logs")
            .insert([
                {
                    aluno_id: params.aluno_id,
                    tipo: params.tipo,
                    descricao: params.descricao,
                    user_id: user.id,
                    data_contato: params.data_contato || new Date().toISOString(),
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from("contact_logs")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return true;
    }
};
