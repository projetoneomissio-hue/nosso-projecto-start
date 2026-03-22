-- Migration: Evolution to Multi-tenant Financial Dashboard
-- Description: Updates RPCs to support unit filtering and includes locacoes in revenue.

-- 1. Update get_financial_kpis to support unit filtering and locacoes
CREATE OR REPLACE FUNCTION public.get_financial_kpis(month_ref DATE, p_unidade_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    prev_start_date DATE;
    prev_end_date DATE;
    
    -- Current Month
    revenue_current NUMERIC := 0;
    locacoes_current NUMERIC := 0;
    expenses_current NUMERIC := 0;
    
    -- Commission Split Current
    repasse_professores NUMERIC := 0;
    receita_liquida NUMERIC := 0;
    
    -- Previous Month
    revenue_prev NUMERIC := 0;
    locacoes_prev NUMERIC := 0;
    expenses_prev NUMERIC := 0;
    
    -- Delinquency
    delinquency_total NUMERIC := 0;
    delinquency_count INTEGER := 0;
    
    -- Variations
    revenue_growth NUMERIC := 0;
    expenses_growth NUMERIC := 0;
    profit_growth NUMERIC := 0;
    
    -- Aux
    salary_total NUMERIC := 0;
    prof_fixed_salaries NUMERIC := 0;
    
    u_id UUID;
BEGIN
    -- Fallback to Matriz if no unit provided
    u_id := COALESCE(p_unidade_id, '00000000-0000-0000-0000-000000000001');

    -- Dates
    start_date := make_date(extract(year from month_ref)::int, extract(month from month_ref)::int, 1);
    end_date := (start_date + interval '1 month' - interval '1 day')::date;
    
    prev_start_date := (start_date - interval '1 month')::date;
    prev_end_date := (start_date - interval '1 day')::date;

    -- 1. Revenue (Pagamentos Pagos + Locacoes)
    SELECT COALESCE(SUM(valor), 0) INTO revenue_current
    FROM public.pagamentos
    WHERE unidade_id = u_id AND status = 'pago' AND data_pagamento BETWEEN start_date AND end_date;

    SELECT COALESCE(SUM(valor), 0) INTO locacoes_current
    FROM public.locacoes
    WHERE unidade_id = u_id AND data BETWEEN start_date AND end_date;

    revenue_current := revenue_current + locacoes_current;

    -- Previous Month Revenue
    SELECT COALESCE(SUM(valor), 0) INTO revenue_prev
    FROM public.pagamentos
    WHERE unidade_id = u_id AND status = 'pago' AND data_pagamento BETWEEN prev_start_date AND prev_end_date;

    SELECT COALESCE(SUM(valor), 0) INTO locacoes_prev
    FROM public.locacoes
    WHERE unidade_id = u_id AND data BETWEEN prev_start_date AND prev_end_date;

    revenue_prev := revenue_prev + locacoes_prev;

    -- 1.1 Repasse aos Professores
    SELECT COALESCE(SUM(p.valor * (prof.percentual_comissao / 100.0)), 0)
    INTO repasse_professores
    FROM public.pagamentos p
    JOIN public.matriculas m ON p.matricula_id = m.id
    JOIN public.turmas t ON m.turma_id = t.id
    JOIN public.professores prof ON t.professor_id = prof.id
    WHERE p.unidade_id = u_id AND p.status = 'pago' AND p.data_pagamento BETWEEN start_date AND end_date;
    
    receita_liquida := revenue_current - repasse_professores;

    -- 2. Expenses (Custos Predio + Salarios fixes)
    
    -- Funcionarios da Unidade
    SELECT COALESCE(SUM(salario), 0) INTO salary_total
    FROM public.funcionarios
    WHERE unidade_id = u_id AND ativo = true;

    -- Professores Fixo da Unidade
    BEGIN
        EXECUTE 'SELECT COALESCE(SUM(valor_fixo), 0) FROM public.professores WHERE unidade_id = $1 AND ativo = true AND tipo_contrato = ''fixo''' 
        INTO prof_fixed_salaries USING u_id;
    EXCEPTION WHEN OTHERS THEN
        prof_fixed_salaries := 0; 
    END;

    -- Custos do Predio
    SELECT COALESCE(SUM(valor), 0) + salary_total + prof_fixed_salaries INTO expenses_current
    FROM public.custos_predio
    WHERE unidade_id = u_id AND data_competencia BETWEEN start_date AND end_date;

    SELECT COALESCE(SUM(valor), 0) + salary_total + prof_fixed_salaries INTO expenses_prev
    FROM public.custos_predio
    WHERE unidade_id = u_id AND data_competencia BETWEEN prev_start_date AND prev_end_date;

    -- 3. Profit
    -- Variations (Safe Division)
    IF revenue_prev = 0 THEN revenue_growth := 0; ELSE revenue_growth := ((revenue_current - revenue_prev) / revenue_prev) * 100; END IF;
    IF expenses_prev = 0 THEN expenses_growth := 0; ELSE expenses_growth := ((expenses_current - expenses_prev) / expenses_prev) * 100; END IF;
    
    -- 4. Delinquency
    SELECT COALESCE(SUM(valor), 0), COUNT(*)
    INTO delinquency_total, delinquency_count
    FROM public.pagamentos
    WHERE unidade_id = u_id AND status = 'pendente' AND data_vencimento < CURRENT_DATE;

    RETURN jsonb_build_object(
        'receita', jsonb_build_object('total', revenue_current, 'liquida', receita_liquida, 'repasse_professores', repasse_professores, 'variacao', revenue_growth),
        'despesas', jsonb_build_object('total', expenses_current, 'variacao', expenses_growth),
        'lucro', jsonb_build_object('total', receita_liquida - expenses_current, 'variacao', 0),
        'inadimplencia', jsonb_build_object('total', delinquency_total, 'quantidade', delinquency_count)
    );
END;
$$;

-- 2. Update get_monthly_revenue for unit filtering and locacoes
CREATE OR REPLACE FUNCTION public.get_monthly_revenue(year_ref INT, p_unidade_id UUID DEFAULT NULL)
RETURNS TABLE (mes TEXT, receita NUMERIC, despesa NUMERIC)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    salary_total NUMERIC := 0;
    prof_fixed_salaries NUMERIC := 0;
    u_id UUID;
BEGIN
    u_id := COALESCE(p_unidade_id, '00000000-0000-0000-0000-000000000001');

    -- Fixed costs for the unit
    SELECT COALESCE(SUM(salario), 0) INTO salary_total
    FROM public.funcionarios
    WHERE unidade_id = u_id AND ativo = true;

    BEGIN
        SELECT COALESCE(SUM(valor_fixo), 0) INTO prof_fixed_salaries
        FROM public.professores
        WHERE unidade_id = u_id AND ativo = true AND tipo_contrato = 'fixo';
    EXCEPTION WHEN OTHERS THEN prof_fixed_salaries := 0; END;

    RETURN QUERY
    WITH months AS (
        SELECT generate_series(
            make_date(year_ref, 1, 1),
            make_date(year_ref, 12, 1),
            '1 month'
        )::date AS m
    )
    SELECT 
        to_char(months.m, 'Mon') as mes,
        (
            COALESCE((SELECT SUM(p.valor) FROM public.pagamentos p WHERE p.unidade_id = u_id AND p.status = 'pago' AND to_char(p.data_pagamento, 'YYYY-MM') = to_char(months.m, 'YYYY-MM')), 0) +
            COALESCE((SELECT SUM(l.valor) FROM public.locacoes l WHERE l.unidade_id = u_id AND to_char(l.data, 'YYYY-MM') = to_char(months.m, 'YYYY-MM')), 0)
        ) as receita,
        (
            COALESCE((SELECT SUM(c.valor) FROM public.custos_predio c WHERE c.unidade_id = u_id AND to_char(c.data_competencia, 'YYYY-MM') = to_char(months.m, 'YYYY-MM')), 0) +
            salary_total + prof_fixed_salaries
        ) as despesa
    FROM months
    ORDER BY months.m;
END;
$$;

-- 3. Update get_receita_por_atividade for unit filtering
CREATE OR REPLACE FUNCTION public.get_receita_por_atividade(p_unidade_id UUID DEFAULT NULL)
RETURNS TABLE (nome TEXT, valor NUMERIC)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    u_id UUID;
BEGIN
    u_id := COALESCE(p_unidade_id, '00000000-0000-0000-0000-000000000001');

    RETURN QUERY
    SELECT 
        a.nome,
        COALESCE(SUM(p.valor), 0) as valor
    FROM public.atividades a
    LEFT JOIN public.turmas t ON t.atividade_id = a.id
    LEFT JOIN public.matriculas m ON m.turma_id = t.id
    LEFT JOIN public.pagamentos p ON p.matricula_id = m.id AND p.status = 'pago'
    WHERE a.unidade_id = u_id
    GROUP BY a.id, a.nome
    ORDER BY valor DESC;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_financial_kpis(DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_revenue(INT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_receita_por_atividade(UUID) TO authenticated;
