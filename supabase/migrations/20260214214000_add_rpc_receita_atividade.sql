-- Função para buscar receita agregada por atividade
-- Esta função evita baixar todas as matrículas para o frontend para fazer a soma
CREATE OR REPLACE FUNCTION public.get_receita_por_atividade()
RETURNS TABLE (nome TEXT, valor NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.nome,
    SUM(a.valor_mensal)::NUMERIC as valor
  FROM public.matriculas m
  JOIN public.turmas t ON m.turma_id = t.id
  JOIN public.atividades a ON t.atividade_id = a.id
  WHERE m.status = 'ativa'
  GROUP BY a.nome;
END;
$$;

-- Garantir permissões para os roles autenticados
GRANT EXECUTE ON FUNCTION public.get_receita_por_atividade() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_receita_por_atividade() TO service_role;
