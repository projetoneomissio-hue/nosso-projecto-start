-- Migration 2/2: RLS policies for the 'secretaria' role
-- Runs AFTER the enum value has been committed in 20260318190000

-- Alunos: view, insert, update
CREATE POLICY "Secretaria can view alunos"
  ON public.alunos FOR SELECT
  USING (has_role(auth.uid(), 'secretaria'));

CREATE POLICY "Secretaria can insert alunos"
  ON public.alunos FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'secretaria'));

CREATE POLICY "Secretaria can update alunos"
  ON public.alunos FOR UPDATE
  USING (has_role(auth.uid(), 'secretaria'));

-- Anamneses: view, insert, update
CREATE POLICY "Secretaria can view anamneses"
  ON public.anamneses FOR SELECT
  USING (has_role(auth.uid(), 'secretaria'));

CREATE POLICY "Secretaria can insert anamneses"
  ON public.anamneses FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'secretaria'));

CREATE POLICY "Secretaria can update anamneses"
  ON public.anamneses FOR UPDATE
  USING (has_role(auth.uid(), 'secretaria'));

-- Atividades e Turmas: view only (for enrollment)
CREATE POLICY "Secretaria can view atividades"
  ON public.atividades FOR SELECT
  USING (has_role(auth.uid(), 'secretaria'));

CREATE POLICY "Secretaria can view turmas"
  ON public.turmas FOR SELECT
  USING (has_role(auth.uid(), 'secretaria'));

-- Matriculas: view and insert (always as 'pendente')
CREATE POLICY "Secretaria can view matriculas"
  ON public.matriculas FOR SELECT
  USING (has_role(auth.uid(), 'secretaria'));

CREATE POLICY "Secretaria can insert matriculas"
  ON public.matriculas FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'secretaria'));

-- Profiles: view (for responsável lookup)
CREATE POLICY "Secretaria can view profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'secretaria'));

-- NOTE: secretaria has NO access to pagamentos, custos_predio, or financial tables
