import { supabase } from "@/integrations/supabase/client";

export const financeiroService = {
    /** Receita mensal (pagamentos pagos no mês atual) */
    async fetchReceitaMensal() {
        // ... método anterior se mantém, mas vamos focar no novo fetchFinanceiroKPIs
        const hoje = new Date();
        const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();

        const { data, error } = await supabase
            .from("pagamentos")
            .select("valor")
            .eq("status", "pago")
            .gte("data_pagamento", primeiroDia)
            .lte("data_pagamento", ultimoDia);

        if (error) throw error;
        return data?.reduce((acc, p) => acc + parseFloat(p.valor.toString()), 0) || 0;
    },

    /** Busca KPIs financeiros com comparação ao mês anterior */
    async fetchFinanceiroKPIs() {
        const hoje = new Date();
        const mesAtualStart = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        const mesAtualEnd = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();

        const mesAnteriorStart = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString();
        const mesAnteriorEnd = new Date(hoje.getFullYear(), hoje.getMonth(), 0).toISOString();

        // Receita
        const { data: receitaAtual } = await supabase
            .from("pagamentos")
            .select("valor")
            .eq("status", "pago")
            .gte("data_pagamento", mesAtualStart)
            .lte("data_pagamento", mesAtualEnd);

        const { data: receitaAnterior } = await supabase
            .from("pagamentos")
            .select("valor")
            .eq("status", "pago")
            .gte("data_pagamento", mesAnteriorStart)
            .lte("data_pagamento", mesAnteriorEnd);

        const totalReceitaAtual = receitaAtual?.reduce((acc, p) => acc + Number(p.valor), 0) || 0;
        const totalReceitaAnterior = receitaAnterior?.reduce((acc, p) => acc + Number(p.valor), 0) || 0;

        // Despesas (Prediais)
        const { data: custosAtual } = await supabase
            .from("custos_predio")
            .select("valor")
            .gte("data_competencia", mesAtualStart)
            .lte("data_competencia", mesAtualEnd);

        const { data: custosAnterior } = await supabase
            .from("custos_predio")
            .select("valor")
            .gte("data_competencia", mesAnteriorStart)
            .lte("data_competencia", mesAnteriorEnd);

        // Salários (Considerando constante para simplificação, ou poderíamos historizar)
        const { data: funcionarios } = await supabase.from("funcionarios").select("salario").eq("ativo", true);
        const totalSalarios = funcionarios?.reduce((acc, f) => acc + Number(f.salario), 0) || 0;

        const totalCustosAtual = (custosAtual?.reduce((acc, c) => acc + Number(c.valor), 0) || 0) + totalSalarios;
        const totalCustosAnterior = (custosAnterior?.reduce((acc, c) => acc + Number(c.valor), 0) || 0) + totalSalarios;

        // Cálculos
        const lucroAtual = totalReceitaAtual - totalCustosAtual;
        const lucroAnterior = totalReceitaAnterior - totalCustosAnterior;

        const calcularCrescimento = (atual: number, anterior: number) => {
            if (anterior === 0) return atual > 0 ? 100 : 0;
            return ((atual - anterior) / anterior) * 100;
        };

        // Inadimplência Atual
        const { data: inadimplencia } = await supabase
            .from("pagamentos")
            .select("valor")
            .eq("status", "pendente")
            .lt("data_vencimento", hoje.toISOString().split("T")[0]);

        const totalInadimplencia = inadimplencia?.reduce((acc, p) => acc + Number(p.valor), 0) || 0;

        return {
            receita: { total: totalReceitaAtual, variacao: calcularCrescimento(totalReceitaAtual, totalReceitaAnterior) },
            despesas: { total: totalCustosAtual, variacao: calcularCrescimento(totalCustosAtual, totalCustosAnterior) },
            lucro: { total: lucroAtual, variacao: calcularCrescimento(lucroAtual, lucroAnterior) },
            inadimplencia: { total: totalInadimplencia, quantidade: inadimplencia?.length || 0 }
        };
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

        const { data, error } = await supabase
            .from("pagamentos")
            .select("valor")
            .eq("status", "pendente")
            .lt("data_vencimento", hoje);

        if (error) throw error;

        return {
            valor: data?.reduce((acc, p) => acc + parseFloat(p.valor.toString()), 0) || 0,
            quantidade: data?.length || 0,
        };
    },

    /** Fluxo de Caixa (Receita x Despesas) dos últimos N meses */
    async fetchFluxoCaixaMeses(meses = 6) {
        const hoje = new Date();
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1), 1);

        // Receitas
        const { data: receitas } = await supabase
            .from("pagamentos")
            .select("valor, data_pagamento")
            .eq("status", "pago")
            .gte("data_pagamento", inicio.toISOString())
            .order("data_pagamento", { ascending: true });

        // Despesas (Custos)
        const { data: custos } = await supabase
            .from("custos_predio")
            .select("valor, data_competencia")
            .gte("data_competencia", inicio.toISOString());

        // Salários (Valor fixo mensal por enquanto)
        const { data: funcionarios } = await supabase.from("funcionarios").select("salario").eq("ativo", true);
        const totalSalariosMensal = funcionarios?.reduce((acc, f) => acc + Number(f.salario), 0) || 0;

        const mesesMap: Record<string, { receita: number; despesa: number }> = {};

        // Inicializar mapa
        for (let i = meses - 1; i >= 0; i--) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const formatKey = d.toLocaleDateString("pt-BR", { month: "short" });
            mesesMap[formatKey] = { receita: 0, despesa: totalSalariosMensal };
        }

        // Somar Receitas
        receitas?.forEach((p) => {
            if (p.data_pagamento) {
                const dataPag = new Date(p.data_pagamento);
                const formatKey = dataPag.toLocaleDateString("pt-BR", { month: "short" });
                if (mesesMap[formatKey]) {
                    mesesMap[formatKey].receita += parseFloat(p.valor.toString());
                }
            }
        });

        // Somar Despesas (Custos)
        custos?.forEach((c) => {
            if (c.data_competencia) {
                const dataDesp = new Date(c.data_competencia);
                const formatKey = dataDesp.toLocaleDateString("pt-BR", { month: "short" });
                if (mesesMap[formatKey]) {
                    mesesMap[formatKey].despesa += parseFloat(c.valor.toString());
                }
            }
        });

        return Object.entries(mesesMap).map(([mes, valores]) => ({
            mes,
            receita: valores.receita,
            despesa: valores.despesa,
            lucro: valores.receita - valores.despesa
        }));
    },

    /** Despesas mensais (custos do prédio + salários) */
    async fetchDespesasMensal() {
        const hoje = new Date();
        const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();

        const { data: custos, error: e1 } = await supabase
            .from("custos_predio")
            .select("valor")
            .gte("data_competencia", primeiroDia)
            .lte("data_competencia", ultimoDia);

        const { data: funcionarios } = await supabase
            .from("funcionarios")
            .select("salario")
            .eq("ativo", true);

        if (e1) throw e1;

        const totalCustos = custos?.reduce((acc, c) => acc + parseFloat(c.valor.toString()), 0) || 0;
        const totalSalarios = funcionarios?.reduce((acc, f) => acc + parseFloat(f.salario.toString()), 0) || 0;

        return {
            total: totalCustos + totalSalarios,
            custos: totalCustos,
            salarios: totalSalarios,
        };
    },

    /** Despesas por categoria (para gráfico de pizza) */
    async fetchDespesasPorCategoria() {
        const hoje = new Date();
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();

        const { data: custos } = await supabase
            .from("custos_predio")
            .select("valor, tipo")
            .gte("data_competencia", inicio)
            .lte("data_competencia", fim);

        const { data: funcionarios } = await supabase
            .from("funcionarios")
            .select("salario")
            .eq("ativo", true);

        const agrupado: Record<string, number> = {};

        custos?.forEach((c) => {
            const categoria = c.tipo || "Outros";
            agrupado[categoria] = (agrupado[categoria] || 0) + Number(c.valor);
        });

        const totalSalarios = funcionarios?.reduce((acc, f) => acc + Number(f.salario), 0) || 0;
        if (totalSalarios > 0) {
            agrupado["Salários"] = totalSalarios;
        }

        return Object.entries(agrupado).map(([name, value]) => ({ name, value }));
    },

    /** Últimos pagamentos recebidos (para tabela) */
    async fetchUltimosPagamentos(limit = 10) {
        const { data, error } = await supabase
            .from("pagamentos")
            .select(`
        id, valor, data_pagamento, status,
        matricula:matriculas(
          aluno:alunos(nome_completo),
          turma:turmas(atividade:atividades(nome))
        )
      `)
            .eq("status", "pago")
            .order("data_pagamento", { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    /** Inadimplentes com detalhes (para tabela com ação de cobrança) */
    async fetchInadimplentes() {
        const hoje = new Date().toISOString().split("T")[0];

        const { data, error } = await supabase
            .from("pagamentos")
            .select(`
        id, valor, data_vencimento, status,
        matricula:matriculas(
          aluno:alunos(
            nome_completo,
            responsavel:profiles!alunos_responsavel_id_fkey(email, nome_completo, telefone)
          ),
          turma:turmas(nome, atividade:atividades(nome))
        )
      `)
            .eq("status", "pendente")
            .lt("data_vencimento", hoje)
            .order("data_vencimento", { ascending: true });

        if (error) throw error;
        return data;
    },

    /** Custos recentes do prédio (para tabela) */
    async fetchCustosRecentes(limit = 10) {
        const { data, error } = await supabase
            .from("custos_predio")
            .select("*")
            .order("data_competencia", { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    /** Dados formatados para exportação PDF */
    async fetchDadosPDF() {
        const hoje = new Date();
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        const { data: receitas, error: recError } = await supabase
            .from("pagamentos")
            .select(`
        valor, data_pagamento,
        matricula:matriculas(
          aluno:alunos(nome_completo),
          turma:turmas(atividade:atividades(nome))
        )
      `)
            .eq("status", "pago")
            .gte("data_pagamento", inicio.toISOString())
            .lte("data_pagamento", fim.toISOString())
            .order("data_pagamento", { ascending: false });

        if (recError) throw recError;

        const { data: custos, error: despError } = await supabase
            .from("custos_predio")
            .select("*")
            .gte("data_competencia", inicio.toISOString())
            .lte("data_competencia", fim.toISOString())
            .order("data_competencia", { ascending: false });

        if (despError) throw despError;

        const formattedReceitas = receitas.map((r: any) => ({
            data: r.data_pagamento,
            descricao: `Mensalidade - ${r.matricula?.aluno?.nome_completo}`,
            categoria: r.matricula?.turma?.atividade?.nome || "Mensalidade",
            valor: r.valor,
            status: "Pago",
            tipo: "receita" as const,
        }));

        const formattedDespesas = custos.map((d: any) => ({
            data: d.data_competencia,
            descricao: d.item,
            categoria: d.tipo,
            valor: d.valor,
            status: "Confirmado",
            tipo: "despesa" as const,
        }));

        const allItems = [...formattedReceitas, ...formattedDespesas].sort(
            (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
        );

        const resumo = {
            totalReceitas: formattedReceitas.reduce((acc, r) => acc + Number(r.valor), 0),
            totalDespesas: formattedDespesas.reduce((acc, d) => acc + Number(d.valor), 0),
            saldo: 0,
        };
        resumo.saldo = resumo.totalReceitas - resumo.totalDespesas;

        return { items: allItems, resumo, periodo: { start: inicio, end: fim } };
    },
};
