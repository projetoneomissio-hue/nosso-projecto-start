-- Tipo de Contrato do Professor
CREATE TYPE tipo_contrato_enum AS ENUM ('parceiro', 'fixo', 'voluntario');

-- Alteração na tabela de professores
ALTER TABLE professores
ADD COLUMN IF NOT EXISTS tipo_contrato tipo_contrato_enum NOT NULL DEFAULT 'parceiro',
ADD COLUMN IF NOT EXISTS valor_fixo NUMERIC(10,2) DEFAULT 0, -- Salário fixo (se aplicável)
ADD COLUMN IF NOT EXISTS comissao_percentual NUMERIC(5,2) DEFAULT 0, -- % de comissão (se parceiro)
ADD COLUMN IF NOT EXISTS chave_pix TEXT; -- Para facilitar pagamentos futuros

COMMENT ON COLUMN professores.tipo_contrato IS 'Modelo de remuneração: parceiro (%), fixo (salário) ou voluntario (0)';
COMMENT ON COLUMN professores.valor_fixo IS 'Valor do salário mensal para contratos fixos';

-- Segurança (RLS)
-- Apenas a Direção pode ver/editar salários fixos
-- Professores só podem ver seus próprios dados, mas NÃO o campo valor_fixo (idealmente, mas o Supabase não tem Column Level Security nativo fácil para SELECT *)
-- A proteção será feita via Views ou Frontend, mas aqui garantimos que apenas admins possam ALTERAR esses dados.

-- Policy: Apenas Admin (Direção) pode atualizar contratos
CREATE POLICY "Apenas Direcao edita contratos financeiros"
ON professores
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles
    WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'direcao')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles
    WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'direcao')
  )
);
