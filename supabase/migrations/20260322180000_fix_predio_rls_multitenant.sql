-- ============================================
-- FIX BUILDING MANAGEMENT RLS & MULTI-TENANCY
-- ============================================

-- 1. Helper function for unidade_id (idempotent)
CREATE OR REPLACE FUNCTION add_unidade_column_to_table(tbl text) RETURNS void AS $$
BEGIN
  -- Add column if not exists
  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES unidades(id);', tbl);
  
  -- Check if column exists but references 'unidades' vs 'units' (system sync)
  -- Our system uses 'unidades'.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'unidade_id') THEN
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I_unidade_id_fkey;', tbl, tbl);
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;', tbl, tbl);
  END IF;

  -- Fill existing with Matriz
  EXECUTE format('UPDATE %I SET unidade_id = %L WHERE unidade_id IS NULL;', tbl, '00000000-0000-0000-0000-000000000001');

  -- Set Default
  EXECUTE format('ALTER TABLE %I ALTER COLUMN unidade_id SET DEFAULT %L;', tbl, '00000000-0000-0000-0000-000000000001');

  -- Set Not Null
  EXECUTE format('ALTER TABLE %I ALTER COLUMN unidade_id SET NOT NULL;', tbl);
END;
$$ LANGUAGE plpgsql;

-- 2. Apply to funcionarios and locacoes
SELECT add_unidade_column_to_table('funcionarios');
SELECT add_unidade_column_to_table('locacoes');

DROP FUNCTION add_unidade_column_to_table(text);

-- 3. Modernize RLS Policies (Subquery Pattern)
-- Using direct subqueries on user_roles/user_unidades is more stable than has_role() in some environments.

-- CUSTOS PREDIO
DROP POLICY IF EXISTS "Direção pode gerenciar custos" ON public.custos_predio;
DROP POLICY IF EXISTS "Coordenação pode ver custos" ON public.custos_predio;

CREATE POLICY "Direção possui acesso total aos custos"
ON public.custos_predio
FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'direcao')
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'direcao')
);

-- FUNCIONARIOS
DROP POLICY IF EXISTS "Direção pode gerenciar funcionários" ON public.funcionarios;

CREATE POLICY "Direção possui acesso total aos funcionários"
ON public.funcionarios
FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'direcao')
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'direcao')
);

-- LOCACOES
DROP POLICY IF EXISTS "Direção pode gerenciar locações" ON public.locacoes;

CREATE POLICY "Direção possui acesso total às locações"
ON public.locacoes
FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'direcao')
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'direcao')
);

-- 4. Audit System Safety Net
-- Ensure audit logs can ALWAYS be inserted by authenticated triggers
-- even if profile.role check fails (as it runs as SECURITY DEFINER).
DROP POLICY IF EXISTS "Serviços podem inserir logs" ON public.audit_logs;
CREATE POLICY "Serviços podem inserir logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);
