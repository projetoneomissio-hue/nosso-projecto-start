-- Policy for Pagamentos Table
-- Enable RLS on pagamentos if not already enabled (it should be)
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they are too broad (optional, but safer to be specific)
-- DROP POLICY IF EXISTS "Enable read access for all users" ON pagamentos;

-- 1. Direção and Coordenação can do everything
CREATE POLICY "Direcao e Coordenacao controlam pagamentos"
ON pagamentos
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles
    WHERE id IN (SELECT user_id FROM user_roles WHERE role IN ('direcao', 'coordenacao'))
  )
);

-- 2. Responsáveis can view ONLY their own payments (via matriculas -> alunos -> responsavel_id)
CREATE POLICY "Responsaveis veem seus proprios pagamentos"
ON pagamentos
FOR SELECT
TO authenticated
USING (
  matricula_id IN (
    SELECT m.id FROM matriculas m
    JOIN alunos a ON a.id = m.aluno_id
    WHERE a.responsavel_id = auth.uid()
  )
);

-- 3. Professores: NO ACCESS to pagamentos table by default.
-- If they need to see "status" of payment for commission, we might need a specific VIEW or function.
-- But currently Comissoes.tsx does NOT query pagamentos (it mocks it).
-- The InadimplenciaTable is for Coordenacao/Direcao (checked in AppRoutes, allowedRoles=['coordenacao']).
-- So Professors don't use InadimplenciaTable.
-- Thus, blocking access to pagamentos for professors is SAFE and CORRECT.

-- We also need to secure 'professores' table 'valor_fixo' column?
-- Supabase doesn't support Column Level Security easily.
-- But since users can only see their own row in 'professores' (assuming existing policy), they only see their own salary.
-- We should verify the existing policy on 'professores'.

-- Let's verify 'professores' RLS
ALTER TABLE professores ENABLE ROW LEVEL SECURITY;

-- Allow professors to view their OWN record
CREATE POLICY "Professores veem seu proprio perfil"
ON professores
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Allow Admin (Direcao/Coordenacao) to view ALL professors
CREATE POLICY "Admins veem todos professores"
ON professores
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles
    WHERE id IN (SELECT user_id FROM user_roles WHERE role IN ('direcao', 'coordenacao', 'admin'))
  )
);
