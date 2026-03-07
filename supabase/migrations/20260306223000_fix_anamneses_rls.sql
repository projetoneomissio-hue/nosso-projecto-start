-- Fix RLS policies for anamneses table
-- Uses the existing has_role() function (roles are in user_roles table, not profiles.role)

-- Drop any existing policies first to avoid conflicts
DROP POLICY IF EXISTS "anamneses_select_policy" ON public.anamneses;
DROP POLICY IF EXISTS "anamneses_insert_policy" ON public.anamneses;
DROP POLICY IF EXISTS "anamneses_update_policy" ON public.anamneses;
DROP POLICY IF EXISTS "anamneses_delete_policy" ON public.anamneses;
DROP POLICY IF EXISTS "Responsáveis podem gerenciar anamneses de seus alunos" ON public.anamneses;
DROP POLICY IF EXISTS "Professores podem ver anamneses" ON public.anamneses;
DROP POLICY IF EXISTS "Direção e coordenação podem ver todas as anamneses" ON public.anamneses;

-- Make sure RLS is enabled
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;

-- SELECT: All authenticated users who have a role can read anamneses
CREATE POLICY "anamneses_select_policy"
  ON public.anamneses
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Staff and responsaveis can insert anamneses
CREATE POLICY "anamneses_insert_policy"
  ON public.anamneses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'direcao') OR
    public.has_role(auth.uid(), 'coordenacao') OR
    public.has_role(auth.uid(), 'professor') OR
    public.is_responsavel_aluno(auth.uid(), aluno_id)
  );

-- UPDATE: Staff and responsaveis can update anamneses
CREATE POLICY "anamneses_update_policy"
  ON public.anamneses
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'direcao') OR
    public.has_role(auth.uid(), 'coordenacao') OR
    public.has_role(auth.uid(), 'professor') OR
    public.is_responsavel_aluno(auth.uid(), aluno_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'direcao') OR
    public.has_role(auth.uid(), 'coordenacao') OR
    public.has_role(auth.uid(), 'professor') OR
    public.is_responsavel_aluno(auth.uid(), aluno_id)
  );

-- DELETE: Only direcao and coordenacao can delete anamneses
CREATE POLICY "anamneses_delete_policy"
  ON public.anamneses
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'direcao') OR
    public.has_role(auth.uid(), 'coordenacao')
  );

-- Add new columns for improved health form
ALTER TABLE public.anamneses
  ADD COLUMN IF NOT EXISTS pne_cid text,
  ADD COLUMN IF NOT EXISTS tem_laudo boolean DEFAULT false;

