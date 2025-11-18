-- Function to mask CPF (shows only last 4 digits)
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN cpf_value IS NULL THEN NULL
    WHEN length(cpf_value) >= 4 THEN 
      '***.***.***-' || right(cpf_value, 2)
    ELSE '***.***.***-**'
  END;
$$;

-- Function to return appropriate CPF based on user role
CREATE OR REPLACE FUNCTION public.get_aluno_cpf(cpf_value text, aluno_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN has_role(auth.uid(), 'direcao'::app_role) THEN cpf_value
    ELSE mask_cpf(cpf_value)
  END;
$$;

-- Create secure view for alunos with masked CPF
CREATE OR REPLACE VIEW public.alunos_secure AS
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

-- Enable RLS on the view
ALTER VIEW public.alunos_secure SET (security_barrier = true);

-- Grant access to authenticated users
GRANT SELECT ON public.alunos_secure TO authenticated;

-- Note: Views in Postgres inherit the RLS policies from underlying tables,
-- so the existing alunos RLS policies will apply to alunos_secure as well