import { supabase } from "@/integrations/supabase/client";

export interface CreateChargeParams {
    aluno_id: string;
    valor: number;
    vencimento: string;
    forma_pagamento: "BOLETO" | "PIX";
    external_id: string; // ID do pagamento no banco
}

export const asaasService = {
    createCharge: async (params: CreateChargeParams) => {
        // 1. Buscar dados do aluno e responsável
        const { data: aluno, error: alunoError } = await supabase
            .from("alunos")
            .select(`
                nome:nome_completo,
                cpf,
                responsavel:profiles!alunos_responsavel_id_fkey(nome:nome_completo, email)
            `)
            .eq("id", params.aluno_id)
            .single();

        if (alunoError) {
            console.error("Erro ao buscar dados do aluno:", alunoError);
            throw new Error("Erro ao buscar dados do aluno");
        }

        // Se o perfil do responsável não tem CPF (sistema legado ou login sem CPF),
        // tentamos usar o CPF do aluno como titular da cobrança se disponível,
        // ou lançamos erro.
        // @ts-ignore
        const responsavelCpf = aluno.responsavel?.cpf || aluno.cpf;

        if (!responsavelCpf) throw new Error("CPF obrigatório para gerar cobrança (no Aluno ou Responsável)");

        try {
            // 2. Chamar Edge Function
            const { data, error } = await supabase.functions.invoke("create-asaas-charge", {
                body: {
                    aluno_nome: aluno.nome,
                    // @ts-ignore
                    responsavel_nome: aluno.responsavel.nome,
                    // @ts-ignore
                    responsavel_cpf: aluno.responsavel.cpf,
                    // @ts-ignore
                    responsavel_email: aluno.responsavel.email,
                    valor: params.valor,
                    vencimento: params.vencimento,
                    forma_pagamento: params.forma_pagamento,
                    external_id: params.external_id,
                },
            });

            if (error) {
                console.error("Erro na Edge Function:", error);
                // Tratamento específico para 401 (Unauthorized)
                // @ts-ignore
                if (error.context?.status === 401 || error.message?.includes("401")) {
                    throw new Error("Não autorizado. Verifique se a 'ASAAS_API_KEY' está configurada nos Secrets do Supabase.");
                }
                throw error;
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            return data;

        } catch (err: any) {
            console.error("Erro ao criar cobrança Asaas:", err);
            // Evita erro de "Response body already used" mascarando o problema real
            if (err.message && err.message.includes("Response body is already used")) {
                throw new Error("Erro de comunicação com a Edge Function (401/500). Verifique os logs do Supabase.");
            }
            throw err;
        }
    },
};
