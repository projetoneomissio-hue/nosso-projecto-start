-- Fix mask_cpf function to set search_path
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN cpf_value IS NULL THEN NULL
    WHEN length(cpf_value) >= 4 THEN 
      '***.***.***-' || right(cpf_value, 2)
    ELSE '***.***.***-**'
  END;
$$;

-- Drop the security definer view and recreate as a regular view
-- Users will access through normal RLS policies on the underlying table
DROP VIEW IF EXISTS public.alunos_secure;

CREATE VIEW public.alunos_secure AS
SELECT 
  id,
  created_at,
  updated_at,
  nome_completo,
  get_aluno_cpf(cpf, id) as cpf,
  responsavel_id,
  endereco,
  telefone,
  data_nascimento
FROM public.alunos;

-- Grant access to authenticated users
GRANT SELECT ON public.alunos_secure TO authenticated;