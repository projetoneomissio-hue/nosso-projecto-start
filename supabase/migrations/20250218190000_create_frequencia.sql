-- Create Frequencia table
CREATE TABLE frequencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES matriculas(id),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  presente BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE frequencia ENABLE ROW LEVEL SECURITY;

-- Policies for Frequencia

-- Direcao/Coordenacao can view all
CREATE POLICY "Direcao and Coordenacao can view all frequencia"
ON frequencia FOR SELECT
TO authenticated
USING (
  (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('direcao', 'coordenacao')
);

-- Professors can view/insert for their classes
-- Logic: Join frequencia -> matricula -> turma -> professor_id
CREATE POLICY "Professors can manage frequencia for their classes"
ON frequencia FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM matriculas m
    JOIN turmas t ON m.turma_id = t.id
    WHERE m.id = frequencia.matricula_id
    AND t.professor_id = auth.uid()
  )
);

-- Responsavel can view for their dependents
CREATE POLICY "Responsaveis can view frequencia for their dependents"
ON frequencia FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM matriculas m
    JOIN alunos a ON m.aluno_id = a.id
    WHERE m.id = frequencia.matricula_id
    AND a.responsavel_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_frequencia_matricula_id ON frequencia(matricula_id);
CREATE INDEX idx_frequencia_data ON frequencia(data);
