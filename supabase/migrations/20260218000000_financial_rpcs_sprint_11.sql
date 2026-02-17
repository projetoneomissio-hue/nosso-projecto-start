-- Migration: Financial RPCs for Sprint 11
-- Description: Moves financial calculation logic from frontend to database for performance

-- 1. KPI Dashboard Function
CREATE OR REPLACE FUNCTION public.get_financial_kpis(month_ref DATE)
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
    revenue_current NUMERIC;
    expenses_current NUMERIC;
    profit_current NUMERIC;
    
    -- Previous Month
    revenue_prev NUMERIC;
    expenses_prev NUMERIC;
    profit_prev NUMERIC;
    
    -- Delinquency
    delinquency_total NUMERIC;
    delinquency_count INTEGER;
    
    -- Variations
    revenue_growth NUMERIC;
    expenses_growth NUMERIC;
    profit_growth NUMERIC;
    
    -- Aux
    salary_total NUMERIC;
BEGIN
    -- Dates (start is 1st day of month, end is last day)
    start_date := make_date(extract(year from month_ref)::int, extract(month from month_ref)::int, 1);
    end_date := (start_date + interval '1 month' - interval '1 day')::date;
    
    prev_start_date := (start_date - interval '1 month')::date;
    prev_end_date := (start_date - interval '1 day')::date;

    -- 1. Revenue (Pagamentos Pagos)
    SELECT COALESCE(SUM(valor), 0) INTO revenue_current
    FROM public.pagamentos
    WHERE status = 'pago' AND data_pagamento BETWEEN start_date AND end_date;

    SELECT COALESCE(SUM(valor), 0) INTO revenue_prev
    FROM public.pagamentos
    WHERE status = 'pago' AND data_pagamento BETWEEN prev_start_date AND prev_end_date;

    -- 2. Expenses (Custos Predio + Salarios)
    -- Calculate Salaries (assuming all active employees are paid every month)
    SELECT COALESCE(SUM(salario), 0) INTO salary_total
    FROM public.funcionarios
    WHERE ativo = true;

    SELECT COALESCE(SUM(valor), 0) + salary_total INTO expenses_current
    FROM public.custos_predio
    WHERE data_competencia BETWEEN start_date AND end_date;

    SELECT COALESCE(SUM(valor), 0) + salary_total INTO expenses_prev
    FROM public.custos_predio
    WHERE data_competencia BETWEEN prev_start_date AND prev_end_date;

    -- 3. Profit
    profit_current := revenue_current - expenses_current;
    profit_prev := revenue_prev - expenses_prev;

    -- 4. Variations (Safe Division)
    IF revenue_prev = 0 THEN revenue_growth := 0; ELSE revenue_growth := ((revenue_current - revenue_prev) / revenue_prev) * 100; END IF;
    IF expenses_prev = 0 THEN expenses_growth := 0; ELSE expenses_growth := ((expenses_current - expenses_prev) / expenses_prev) * 100; END IF;
    IF profit_prev = 0 THEN profit_growth := 0; ELSE profit_growth := ((profit_current - profit_prev) / profit_prev) * 100; END IF;

    -- 5. Delinquency (Pending and Overdue)
    -- Note: This is cumulative, not just for the month.
    SELECT COALESCE(SUM(valor), 0), COUNT(*)
    INTO delinquency_total, delinquency_count
    FROM public.pagamentos
    WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE;

    -- Return JSON
    RETURN jsonb_build_object(
        'receita', jsonb_build_object('total', revenue_current, 'variacao', revenue_growth),
        'despesas', jsonb_build_object('total', expenses_current, 'variacao', expenses_growth),
        'lucro', jsonb_build_object('total', profit_current, 'variacao', profit_growth),
        'inadimplencia', jsonb_build_object('total', delinquency_total, 'quantidade', delinquency_count)
    );
END;
$$;

-- 2. Monthly Revenue Chart (Last 12 months or selected year)
CREATE OR REPLACE FUNCTION public.get_monthly_revenue(year_ref INT)
RETURNS TABLE (mes TEXT, receita NUMERIC, despesa NUMERIC)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    salary_total NUMERIC;
BEGIN
    SELECT COALESCE(SUM(salario), 0) INTO salary_total
    FROM public.funcionarios
    WHERE ativo = true;

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
        COALESCE(SUM(p.valor), 0) as receita,
        (COALESCE((
            SELECT SUM(c.valor) 
            FROM public.custos_predio c 
            WHERE to_char(c.data_competencia, 'YYYY-MM') = to_char(months.m, 'YYYY-MM')
        ), 0) + salary_total) as despesa
    FROM months
    LEFT JOIN public.pagamentos p ON to_char(p.data_pagamento, 'YYYY-MM') = to_char(months.m, 'YYYY-MM') AND p.status = 'pago'
    GROUP BY months.m
    ORDER BY months.m;
END;
$$;

-- Grant Refresh
GRANT EXECUTE ON FUNCTION public.get_financial_kpis(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_kpis(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_monthly_revenue(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_revenue(INT) TO service_role;
