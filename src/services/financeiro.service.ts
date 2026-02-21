import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const financeiroService = {
    /** Receita mensal (pagamentos pagos no mês atual) */
    async fetchReceitaMensal() {
        const hoje = new Date().toISOString().split("T")[0];
        const { data, error } = await supabase.rpc("get_financial_kpis", { month_ref: hoje });
        if (error) throw error;
        // @ts-ignore - RPC types might not be generated yet
        return Number(data?.receita?.total) || 0;
    },

    /** Busca KPIs financeiros com filtro de mês/ano opcional */
    async fetchFinanceiroKPIs(params?: { month?: number; year?: number }) {
        let referenceDate: string;

        if (params?.month && params?.year) {
            // Se passar mês/ano, cria data no dia 10 (vencimento padrão)
            referenceDate = new Date(params.year, params.month - 1, 10).toISOString().split("T")[0];
        } else {
            referenceDate = new Date().toISOString().split("T")[0];
        }

        const { data, error } = await supabase.rpc("get_financial_kpis", { month_ref: referenceDate });
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

    /** Fluxo de Caixa (Receita x Despesas) filtrado por ano */
    async fetchFluxoCaixaMeses(year?: number) {
        const yearRef = year || new Date().getFullYear();
        const { data, error } = await supabase.rpc("get_monthly_revenue", { year_ref: yearRef });

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
    },

    /** Despesas por tipo (ex-categoria) */
    async fetchDespesasPorTipo() {
        const { data, error } = await supabase
            .from("custos_predio")
            .select("tipo, valor");

        if (error) throw error;

        const summary: Record<string, number> = {};
        data?.forEach((item) => {
            const cat = item.tipo || "Outros";
            summary[cat] = (summary[cat] || 0) + Number(item.valor);
        });

        return Object.entries(summary).map(([name, value]) => ({ name, value }));
    },

    /** Últimos pagamentos recebidos */
    async fetchUltimosPagamentos(limit = 10) {
        const { data, error } = await supabase
            .from("pagamentos")
            .select(`
                id,
                valor,
                data_pagamento,
                status,
                matricula:matriculas(
                    aluno:alunos(
                        nome_completo,
                        responsavel:profiles(id, nome_completo, email, telefone)
                    ),
                    turma:turmas(
                        id,
                        nome,
                        atividade:atividades(id, nome)
                    )
                )
            `)
            .eq("status", "pago")
            .order("data_pagamento", { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    /** Custos recentes do prédio */
    async fetchCustosRecentes(limit = 10) {
        const { data, error } = await supabase
            .from("custos_predio")
            .select("id, item, valor, tipo, data_competencia")
            .order("data_competencia", { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    /** Lista de inadimplentes detalhada (Otimizada) */
    async fetchInadimplentesOtimizado() {
        const { data, error } = await supabase
            .from("pagamentos")
            .select(`
                id,
                valor,
                data_vencimento,
                status,
                matricula:matriculas(
                    aluno:alunos(
                        id,
                        nome_completo,
                        responsavel:profiles(id, nome_completo, email, telefone)
                    ),
                    turma:turmas(
                        id,
                        nome,
                        atividade:atividades(id, nome)
                    )
                )
            `)
            .eq("status", "pendente")
            .lt("data_vencimento", new Date().toISOString().split("T")[0])
            .order("data_vencimento", { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /** Dados para exportação PDF/CSV */
    async fetchDadosPDF() {
        const hoje = new Date();
        const startOfMonth = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();

        const [pagamentos, custos] = await Promise.all([
            supabase.from("pagamentos").select("*").gte("created_at", startOfMonth),
            supabase.from("custos_predio").select("*").gte("created_at", startOfMonth)
        ]);

        if (pagamentos.error) throw pagamentos.error;
        if (custos.error) throw custos.error;

        const merged = [
            ...(pagamentos.data?.map(p => ({ ...p, tipo: 'entrada', categoria: 'Mensalidade' })) || []),
            ...(custos.data?.map(c => ({ ...c, tipo: 'saida' })) || [])
        ];

        return {
            data: merged,
            periodo: format(hoje, "MMMM yyyy", { locale: ptBR })
        };
    }
};
