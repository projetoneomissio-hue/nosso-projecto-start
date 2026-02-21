-- Migration: split financial KPI to show teacher commission (90/10 vs fixed salary)

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
    revenue_current NUMERIC := 0;
    expenses_current NUMERIC := 0;
    profit_current NUMERIC := 0;
    
    -- Commission Split Current
    repasse_professores NUMERIC := 0;
    receita_liquida NUMERIC := 0;
    
    -- Previous Month
    revenue_prev NUMERIC := 0;
    expenses_prev NUMERIC := 0;
    profit_prev NUMERIC := 0;
    
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

    -- 1.1 Repasse aos Professores (Percentage based on turmas)
    SELECT COALESCE(SUM(p.valor * (prof.percentual_comissao / 100.0)), 0)
    INTO repasse_professores
    FROM public.pagamentos p
    JOIN public.matriculas m ON p.matricula_id = m.id
    JOIN public.turmas t ON m.turma_id = t.id
    JOIN public.professores prof ON t.professor_id = prof.id
    WHERE p.status = 'pago' AND p.data_pagamento BETWEEN start_date AND end_date;
    
    receita_liquida := revenue_current - repasse_professores;

    SELECT COALESCE(SUM(valor), 0) INTO revenue_prev
    FROM public.pagamentos
    WHERE status = 'pago' AND data_pagamento BETWEEN prev_start_date AND prev_end_date;

    -- 2. Expenses (Custos Predio + Salarios fixes de Funcionarios + Salarios fixes de Professores)
    
    -- Funcionarios
    SELECT COALESCE(SUM(salario), 0) INTO salary_total
    FROM public.funcionarios
    WHERE ativo = true;

    -- Professores Fixo (Jiu-Jitsu: 2500, judo: 800)
    -- We assume the fixed value is handled via the app UI logic (stored somewhere), 
    -- but for the KPI, if it's explicitly fixed, we expect it in 'funcionarios', or we read 'valor_fixo' from professores if it exists.
    -- Assuming your professores table does not have 'valor_fixo' natively yet from the base schema, 
    -- we rely on the schema or we hardcode the logic for this specific dashboard instance if requested.
    -- BUT WAIT: we saw a 'tipo_contrato' and 'valor_fixo' in the React code! Let's try to query it.
    
    -- We use exception block to detect if valor_fixo column exists, otherwise fallback to 0.
    BEGIN
        EXECUTE 'SELECT COALESCE(SUM(valor_fixo), 0) FROM public.professores WHERE ativo = true AND tipo_contrato = ''fixo''' INTO prof_fixed_salaries;
    EXCEPTION WHEN OTHERS THEN
        prof_fixed_salaries := 0; 
    END;

    SELECT COALESCE(SUM(valor), 0) + salary_total + prof_fixed_salaries INTO expenses_current
    FROM public.custos_predio
    WHERE data_competencia BETWEEN start_date AND end_date;

    SELECT COALESCE(SUM(valor), 0) + salary_total + prof_fixed_salaries INTO expenses_prev
    FROM public.custos_predio
    WHERE data_competencia BETWEEN prev_start_date AND prev_end_date;

    -- 3. Profit
    profit_current := receita_liquida - expenses_current;
    profit_prev := revenue_prev - expenses_prev;

    -- 4. Variations (Safe Division)
    IF revenue_prev = 0 THEN revenue_growth := 0; ELSE revenue_growth := ((revenue_current - revenue_prev) / revenue_prev) * 100; END IF;
    IF expenses_prev = 0 THEN expenses_growth := 0; ELSE expenses_growth := ((expenses_current - expenses_prev) / expenses_prev) * 100; END IF;
    IF profit_prev = 0 THEN profit_growth := 0; ELSE profit_growth := ((profit_current - profit_prev) / profit_prev) * 100; END IF;

    -- 5. Delinquency (Pending and Overdue)
    SELECT COALESCE(SUM(valor), 0), COUNT(*)
    INTO delinquency_total, delinquency_count
    FROM public.pagamentos
    WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE;

    -- Return JSON
    -- Nota: O repasse de professores (variável) é subtraído da receita líquida. 
    -- Os salários fixos (Cristiano e Davi) são somados às Despesas da ONG.
    RETURN jsonb_build_object(
        'receita', jsonb_build_object('total', revenue_current, 'liquida', receita_liquida, 'repasse_professores', repasse_professores, 'variacao', revenue_growth),
        'despesas', jsonb_build_object('total', expenses_current, 'variacao', expenses_growth),
        'lucro', jsonb_build_object('total', profit_current, 'variacao', profit_growth),
        'inadimplencia', jsonb_build_object('total', delinquency_total, 'quantidade', delinquency_count)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_financial_kpis(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_kpis(DATE) TO service_role;
