import { supabase } from "@/integrations/supabase/client";

export const financeiroService = {
    /** Receita mensal (pagamentos pagos no mês atual) */
    async fetchReceitaMensal() {
        const hoje = new Date().toISOString().split("T")[0];
        const { data, error } = await supabase.rpc("get_financial_kpis", { month_ref: hoje });
        if (error) throw error;
        // @ts-ignore - RPC types might not be generated yet
        return Number(data?.receita?.total) || 0;
    },

    /** Busca KPIs financeiros com comparação ao mês anterior */
    async fetchFinanceiroKPIs() {
        const hoje = new Date().toISOString().split("T")[0];
        const { data, error } = await supabase.rpc("get_financial_kpis", { month_ref: hoje });

        if (error) throw error;

        // @ts-ignore
        return data;
    },

    /** Receita agregada por atividade (via RPC) */
    async fetchReceitaPorAtividade() {
        const { data, error } = await supabase.rpc("get_receita_por_atividade");
        if (error) throw error;
        return data || [];
    },

    /** Inadimplência (pendentes vencidos) */
    async fetchInadimplencia() {
        const hoje = new Date().toISOString().split("T")[0];
        const { data, error } = await supabase.rpc("get_financial_kpis", { month_ref: hoje });

        if (error) throw error;

        // @ts-ignore
        return {
            valor: Number(data?.inadimplencia?.total || 0),
            quantidade: Number(data?.inadimplencia?.quantidade || 0),
        };
    },

    /** Fluxo de Caixa (Receita x Despesas) dos últimos meses (Ano Corrente) */
    async fetchFluxoCaixaMeses(meses = 12) {
        // Ignora parametro 'meses' e pega o ano atual, pois a RPC é otimizada por ano
        const year = new Date().getFullYear();
        const { data, error } = await supabase.rpc("get_monthly_revenue", { year_ref: year });

        if (error) throw error;

        // Converter Array [{mes: 'Jan', receita: 100...}] para Objeto { 'Jan': {receita: 100...} }
        // Mantendo compatibilidade com o frontend atual que espera um Record<string, ...>
        const result: Record<string, { receita: number; despesa: number }> = {};

        // @ts-ignore
        data?.forEach((item: any) => {
            result[item.mes] = {
                receita: Number(item.receita),
                despesa: Number(item.despesa)
            };
        });

        return result;
    }
};
