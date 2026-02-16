-- ============================================================
-- Enforce Turma Capacity at Database Level
-- Prevents race conditions where multiple matriculas could 
-- exceed the capacidade_maxima of a turma
-- ============================================================

-- 1. Function that checks capacity before allowing a new active matricula
CREATE OR REPLACE FUNCTION check_turma_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_capacidade INTEGER;
  v_matriculas_ativas INTEGER;
BEGIN
  -- Only check when status is being set to 'ativa' or on insert with status 'ativa'
  -- Also check on insert with 'pendente' to count pending as "reserved slots"
  IF (TG_OP = 'INSERT' AND NEW.status IN ('ativa', 'pendente'))
     OR (TG_OP = 'UPDATE' AND NEW.status = 'ativa' AND OLD.status != 'ativa') THEN
    
    -- Lock the turma row to prevent concurrent inserts
    SELECT capacidade_maxima INTO v_capacidade
    FROM turmas
    WHERE id = NEW.turma_id
    FOR UPDATE;

    -- Count existing active + pending matriculas (excluding current row on update)
    SELECT COUNT(*) INTO v_matriculas_ativas
    FROM matriculas
    WHERE turma_id = NEW.turma_id
      AND status IN ('ativa', 'pendente')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000');

    -- Check capacity
    IF v_matriculas_ativas >= v_capacidade THEN
      RAISE EXCEPTION 'Turma lotada: capacidade máxima de % alunos atingida. Atualmente há % matriculas ativas/pendentes.', 
        v_capacidade, v_matriculas_ativas
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS enforce_turma_capacity ON matriculas;
CREATE TRIGGER enforce_turma_capacity
  BEFORE INSERT OR UPDATE ON matriculas
  FOR EACH ROW
  EXECUTE FUNCTION check_turma_capacity();

-- 3. Ensure capacidade_maxima has a sensible default and constraint
ALTER TABLE turmas 
  ALTER COLUMN capacidade_maxima SET DEFAULT 20;

-- Add CHECK constraint if not exists (safe to run multiple times)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'turmas_capacidade_maxima_positive'
  ) THEN
    ALTER TABLE turmas 
      ADD CONSTRAINT turmas_capacidade_maxima_positive 
      CHECK (capacidade_maxima > 0 AND capacidade_maxima <= 999);
  END IF;
END $$;

-- 4. Helper RPC to get turma availability (for frontend use)
CREATE OR REPLACE FUNCTION get_turma_vagas(p_turma_id UUID)
RETURNS TABLE (
  capacidade_maxima INTEGER,
  matriculas_ativas BIGINT,
  vagas_disponiveis BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.capacidade_maxima,
    COUNT(m.id) FILTER (WHERE m.status IN ('ativa', 'pendente')) as matriculas_ativas,
    t.capacidade_maxima - COUNT(m.id) FILTER (WHERE m.status IN ('ativa', 'pendente')) as vagas_disponiveis
  FROM turmas t
  LEFT JOIN matriculas m ON m.turma_id = t.id
  WHERE t.id = p_turma_id
  GROUP BY t.id, t.capacidade_maxima;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
