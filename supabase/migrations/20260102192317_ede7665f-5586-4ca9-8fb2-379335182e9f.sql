-- Drop the existing policy that gives professors access to all students
DROP POLICY IF EXISTS "Direção, coordenação e professores podem ver todos os aluno" ON public.alunos;

-- Create new policy with restricted access for professors
CREATE POLICY "Direção e coordenação podem ver todos os alunos" 
ON public.alunos 
FOR SELECT 
USING (
  has_role(auth.uid(), 'direcao'::app_role) 
  OR has_role(auth.uid(), 'coordenacao'::app_role)
);

-- Create separate policy for professors - only students in their classes
CREATE POLICY "Professores podem ver alunos de suas turmas" 
ON public.alunos 
FOR SELECT 
USING (
  has_role(auth.uid(), 'professor'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.matriculas m
    JOIN public.turmas t ON m.turma_id = t.id
    JOIN public.professores p ON t.professor_id = p.id
    WHERE m.aluno_id = alunos.id
    AND p.user_id = auth.uid()
  )
);