import { useQuery } from "@tanstack/react-query";
import { financeiroService } from "@/services/financeiro.service";

/** Hook para KPIs: Receita, Despesas, Lucro e Inadimplência (com comparação) */
export function useFinanceiroKPIs() {
    return useQuery({
        queryKey: ["financeiro-kpis"],
        queryFn: financeiroService.fetchFinanceiroKPIs,
    });
}

/** Hook para gráfico: Despesas por categoria */
export function useDespesasPorCategoria() {
    return useQuery({
        queryKey: ["financeiro-despesas-categoria"],
        queryFn: financeiroService.fetchDespesasPorCategoria,
    });
}

/** Hook para gráfico: Receita por atividade (RPC) */
export function useReceitaPorAtividade() {
    return useQuery({
        queryKey: ["financeiro-receita-atividade"],
        queryFn: financeiroService.fetchReceitaPorAtividade,
    });
}

/** Hook para gráfico: Fluxo de Caixa (Receita x Despesas) dos últimos N meses */
export function useFluxoCaixaMeses(meses = 6) {
    return useQuery({
        queryKey: ["financeiro-fluxo-caixa", meses],
        queryFn: () => financeiroService.fetchFluxoCaixaMeses(meses),
    });
}

/** Hook para tabela: Últimos pagamentos recebidos */
export function useUltimosPagamentos(limit = 10) {
    return useQuery({
        queryKey: ["financeiro-ultimos-pagamentos", limit],
        queryFn: () => financeiroService.fetchUltimosPagamentos(limit),
    });
}

/** Hook para tabela: Custos recentes do prédio */
export function useCustosRecentes(limit = 10) {
    return useQuery({
        queryKey: ["custos-predio", limit],
        queryFn: () => financeiroService.fetchCustosRecentes(limit),
    });
}

/** Hook para tabela: Lista de inadimplentes com detalhes */
export function useInadimplentes() {
    return useQuery({
        queryKey: ["financeiro-inadimplentes"],
        queryFn: financeiroService.fetchInadimplentes,
    });
}
