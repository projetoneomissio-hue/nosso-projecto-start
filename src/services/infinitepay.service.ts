import { supabase } from "@/integrations/supabase/client";

export interface CreateCheckoutLinkResult {
    success: boolean;
    gateway_url: string;
    pagamentoId: string;
    alunoNome: string;
    atividadeNome: string;
    valor: number;
}

export const infinitePayService = {
    /**
     * Creates a checkout link via InfinitePay for a given payment ID.
     * Calls the `create-infinitepay-link` Edge Function which handles:
     * - RBAC permission checks
     * - Payment validation
     * - InfinitePay API call
     * - Saving gateway_url to the pagamentos table
     */
    createCheckoutLink: async (pagamentoId: string): Promise<CreateCheckoutLinkResult> => {
        const { data, error } = await supabase.functions.invoke("create-infinitepay-link", {
            body: { pagamentoId },
        });

        if (error) {
            console.error("Erro na Edge Function InfinitePay:", error);
            // @ts-ignore
            if (error.context?.status === 401 || error.message?.includes("401")) {
                throw new Error("Não autorizado. Verifique se o 'INFINITEPAY_HANDLE' está configurado nos Secrets do Supabase.");
            }
            throw error;
        }

        if (data?.error) {
            throw new Error(data.error);
        }

        return data as CreateCheckoutLinkResult;
    },
};
