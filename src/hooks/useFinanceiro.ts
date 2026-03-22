import { useQuery } from "@tanstack/react-query";
import { financeiroService } from "@/services/financeiro.service";
import { useUnidade } from "@/contexts/UnidadeContext";

/** Hook para KPIs: Receita, Despesas, Lucro e Inadimplência (com comparação) */
export function useFinanceiroKPIs() {
    const { currentUnidade } = useUnidade();
    return useQuery({
        queryKey: ["financeiro-kpis", currentUnidade?.id],
        queryFn: () => financeiroService.fetchFinanceiroKPIs({ unidadeId: currentUnidade?.id }),
    });
}

/** Hook para gráfico: Despesas por categoria */
export function useDespesasPorCategoria() {
    const { currentUnidade } = useUnidade();
    return useQuery({
        queryKey: ["financeiro-despesas-categoria", currentUnidade?.id],
        queryFn: () => financeiroService.fetchDespesasPorTipo(currentUnidade?.id),
    });
}

/** Hook para gráfico: Receita por atividade (RPC) */
export function useReceitaPorAtividade() {
    const { currentUnidade } = useUnidade();
    return useQuery({
        queryKey: ["financeiro-receita-atividade", currentUnidade?.id],
        queryFn: () => financeiroService.fetchReceitaPorAtividade(currentUnidade?.id),
    });
}

/** Hook para gráfico: Fluxo de Caixa (Receita x Despesas) dos últimos N meses */
export function useFluxoCaixaMeses() {
    const { currentUnidade } = useUnidade();
    return useQuery({
        queryKey: ["financeiro-fluxo-caixa", currentUnidade?.id],
        queryFn: () => financeiroService.fetchFluxoCaixaMeses(new Date().getFullYear(), currentUnidade?.id),
    });
}

/** Hook para tabela: Últimos pagamentos recebidos */
export function useUltimosPagamentos(limit = 10) {
    const { currentUnidade } = useUnidade();
    return useQuery({
        queryKey: ["financeiro-ultimos-pagamentos", limit, currentUnidade?.id],
        queryFn: () => financeiroService.fetchUltimosPagamentos(limit, currentUnidade?.id),
    });
}

/** Hook para tabela: Custos recentes do prédio */
export function useCustosRecentes(limit = 10) {
    const { currentUnidade } = useUnidade();
    return useQuery({
        queryKey: ["custos-predio", limit, currentUnidade?.id],
        queryFn: () => financeiroService.fetchCustosRecentes(limit, currentUnidade?.id),
    });
}

/** Hook para tabela: Lista de inadimplentes com detalhes */
export function useInadimplentes() {
    const { currentUnidade } = useUnidade();
    return useQuery({
        queryKey: ["financeiro-inadimplentes", currentUnidade?.id],
        queryFn: () => financeiroService.fetchInadimplentesOtimizado(currentUnidade?.id),
    });
}
