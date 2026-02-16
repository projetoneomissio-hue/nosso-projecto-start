import { useQuery } from "@tanstack/react-query";
import { financeiroService } from "@/services/financeiro.service";

/** Hook para KPI: Receita do mês atual */
export function useReceitaMensal() {
    return useQuery({
        queryKey: ["financeiro-receita-mensal"],
        queryFn: financeiroService.fetchReceitaMensal,
    });
}

/** Hook para KPI: Despesas do mês atual (custos + salários) */
export function useDespesasMensal() {
    return useQuery({
        queryKey: ["financeiro-despesas", "custos-predio"],
        queryFn: financeiroService.fetchDespesasMensal,
    });
}

/** Hook para KPI: Inadimplência */
export function useInadimplencia() {
    return useQuery({
        queryKey: ["financeiro-inadimplencia"],
        queryFn: financeiroService.fetchInadimplencia,
    });
}

/** Hook para gráfico: Receita por atividade (RPC) */
export function useReceitaPorAtividade() {
    return useQuery({
        queryKey: ["financeiro-receita-atividade"],
        queryFn: financeiroService.fetchReceitaPorAtividade,
    });
}

/** Hook para gráfico: Receita dos últimos N meses */
export function useReceitaMeses(meses = 6) {
    return useQuery({
        queryKey: ["financeiro-receita-meses", meses],
        queryFn: () => financeiroService.fetchReceitaMeses(meses),
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
