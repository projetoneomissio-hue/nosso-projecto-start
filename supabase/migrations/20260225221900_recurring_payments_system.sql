-- ============================================================
-- Migration: Recurring Monthly Payments System
-- Creates configuracoes table and auto-generation function
-- ============================================================

-- 1. Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir dia de vencimento padrão (dia 5)
INSERT INTO public.configuracoes (chave, valor, descricao)
VALUES ('dia_vencimento', '5', 'Dia do mês para vencimento das mensalidades (1-28)')
ON CONFLICT (chave) DO NOTHING;

-- RLS: Apenas direcao pode alterar configurações
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Direcao gerencia configuracoes" ON public.configuracoes;
CREATE POLICY "Direcao gerencia configuracoes"
ON public.configuracoes FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'direcao')
);

DROP POLICY IF EXISTS "Todos podem ler configuracoes" ON public.configuracoes;
CREATE POLICY "Todos podem ler configuracoes"
ON public.configuracoes FOR SELECT
USING (true);

-- 1.5 Adicionar coluna referencia na tabela pagamentos (se não existir)
ALTER TABLE public.pagamentos ADD COLUMN IF NOT EXISTS referencia TEXT;

-- 2. Função para gerar pagamentos mensais automaticamente
-- Deve ser chamada via Cron no dia 1º de cada mês
CREATE OR REPLACE FUNCTION public.gerar_pagamentos_mensais()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dia_vencimento INT;
  v_mes_referencia DATE;
  v_data_vencimento DATE;
  v_count INT := 0;
  v_matricula RECORD;
BEGIN
  -- Buscar dia de vencimento configurado
  SELECT valor::INT INTO v_dia_vencimento
  FROM public.configuracoes
  WHERE chave = 'dia_vencimento';
  
  IF v_dia_vencimento IS NULL THEN
    v_dia_vencimento := 5; -- fallback
  END IF;

  -- Mês de referência = mês atual + 1
  -- Ex: roda dia 1/março → gera pagamentos pra abril
  v_mes_referencia := date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
  
  -- Calcular data de vencimento (limitando ao último dia do mês se necessário)
  v_data_vencimento := LEAST(
    (v_mes_referencia + (v_dia_vencimento - 1) * INTERVAL '1 day')::DATE,
    (date_trunc('month', v_mes_referencia) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
  );

  -- Buscar matrículas ativas que NÃO têm pagamento para o mês de referência
  FOR v_matricula IN
    SELECT 
      m.id AS matricula_id,
      m.unidade_id,
      a.valor_mensal
    FROM public.matriculas m
    JOIN public.turmas t ON t.id = m.turma_id
    JOIN public.atividades a ON a.id = t.atividade_id
    WHERE m.status = 'ativa'
      AND a.valor_mensal > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.pagamentos p
        WHERE p.matricula_id = m.id
          AND date_trunc('month', p.data_vencimento) = v_mes_referencia
      )
  LOOP
    INSERT INTO public.pagamentos (
      matricula_id,
      valor,
      data_vencimento,
      status,
      referencia,
      unidade_id
    ) VALUES (
      v_matricula.matricula_id,
      v_matricula.valor_mensal,
      v_data_vencimento,
      'pendente',
      to_char(v_mes_referencia, 'YYYY-MM'),
      v_matricula.unidade_id
    );
    
    v_count := v_count + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'pagamentos_gerados', v_count,
    'mes_referencia', to_char(v_mes_referencia, 'YYYY-MM'),
    'data_vencimento', v_data_vencimento
  );
END;
$$;

