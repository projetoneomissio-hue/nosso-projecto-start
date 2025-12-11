-- Create comunicados table
CREATE TABLE IF NOT EXISTS comunicados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('geral', 'turma', 'aluno')),
  destinatario_id UUID,
  urgente BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  criado_por UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;

-- Policy: Direcao/Coordenacao can ALL (Removed 'admin' as it is not in enum)
CREATE POLICY "Direcao e Coord manage all" ON comunicados
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('direcao', 'coordenacao')
    )
  );

-- Policy: Responsaveis can VIEW relevant
CREATE POLICY "Responsaveis view relevant" ON comunicados
  FOR SELECT
  TO authenticated
  USING (
    -- 1. Geral
    tipo = 'geral'
    OR
    -- 2. Turma (if responsible has a student in that turma)
    (tipo = 'turma' AND destinatario_id IN (
       SELECT turma_id FROM matriculas 
       WHERE aluno_id IN (
         SELECT id FROM alunos WHERE responsavel_id = auth.uid()
       )
    ))
    OR
    -- 3. Aluno (if responsible is parent of that student)
    (tipo = 'aluno' AND destinatario_id IN (
       SELECT id FROM alunos WHERE responsavel_id = auth.uid()
    ))
  );
