
-- Fix infinite recursion between alunos and matriculas RLS policies
-- The issue: alunos professor policy -> matriculas -> alunos (loop)
-- Solution: Use SECURITY DEFINER functions to bypass RLS in subqueries

-- 1. Create helper function to check if aluno belongs to responsavel (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_aluno_responsavel_id(p_aluno_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT responsavel_id FROM public.alunos WHERE id = p_aluno_id;
$$;

-- 2. Create helper function to get aluno_ids for a responsavel (bypasses RLS)  
CREATE OR REPLACE FUNCTION public.get_alunos_by_responsavel(p_responsavel_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.alunos WHERE responsavel_id = p_responsavel_id;
$$;

-- 3. Create helper to check if professor has aluno in their turmas (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_professor_aluno(p_user_id uuid, p_aluno_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.matriculas m
    JOIN public.turmas t ON m.turma_id = t.id
    JOIN public.professores p ON t.professor_id = p.id
    WHERE m.aluno_id = p_aluno_id AND p.user_id = p_user_id
  );
$$;

-- 4. Drop problematic policies on alunos
DROP POLICY IF EXISTS "Professores podem ver alunos de suas turmas" ON public.alunos;

-- 5. Recreate professor policy using security definer function
CREATE POLICY "Professores podem ver alunos de suas turmas"
ON public.alunos FOR SELECT
USING (
  has_role(auth.uid(), 'professor'::app_role)
  AND is_professor_aluno(auth.uid(), id)
);

-- 6. Drop problematic policies on matriculas that reference alunos
DROP POLICY IF EXISTS "Responsáveis podem ver matrículas de seus alunos" ON public.matriculas;
DROP POLICY IF EXISTS "Responsáveis podem criar matrículas para seus alunos" ON public.matriculas;

-- 7. Recreate matriculas policies using security definer function
CREATE POLICY "Responsáveis podem ver matrículas de seus alunos"
ON public.matriculas FOR SELECT
USING (
  aluno_id IN (SELECT get_alunos_by_responsavel(auth.uid()))
);

CREATE POLICY "Responsáveis podem criar matrículas para seus alunos"
ON public.matriculas FOR INSERT
WITH CHECK (
  aluno_id IN (SELECT get_alunos_by_responsavel(auth.uid()))
);

-- 8. Fix pagamentos policies that reference matriculas->alunos
DROP POLICY IF EXISTS "Responsáveis podem ver pagamentos de seus alunos" ON public.pagamentos;

CREATE POLICY "Responsáveis podem ver pagamentos de seus alunos"
ON public.pagamentos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matriculas m
    WHERE m.id = pagamentos.matricula_id
    AND m.aluno_id IN (SELECT get_alunos_by_responsavel(auth.uid()))
  )
);

-- 9. Fix presencas policy that references matriculas->alunos
DROP POLICY IF EXISTS "Responsáveis podem ver presenças de seus alunos" ON public.presencas;

CREATE POLICY "Responsáveis podem ver presenças de seus alunos"
ON public.presencas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matriculas m
    WHERE m.id = presencas.matricula_id
    AND m.aluno_id IN (SELECT get_alunos_by_responsavel(auth.uid()))
  )
);

-- 10. Fix comunicados policy that references matriculas->alunos
DROP POLICY IF EXISTS "Responsáveis podem ver comunicados destinados a eles" ON public.comunicados;

CREATE POLICY "Responsáveis podem ver comunicados destinados a eles"
ON public.comunicados FOR SELECT
USING (
  has_role(auth.uid(), 'responsavel'::app_role)
  AND (
    tipo = 'geral'::text
    OR destinatario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.matriculas m
      WHERE m.turma_id = comunicados.turma_id
      AND m.aluno_id IN (SELECT get_alunos_by_responsavel(auth.uid()))
      AND m.status = 'ativa'::status_matricula
    )
  )
);
