-- ============================================================
-- Unique CPF Constraint (Partial — only when NOT NULL)
-- Prevents duplicate student registrations while allowing
-- students without CPF (nullable field)
-- ============================================================

-- 1. Clean up any existing duplicates before adding constraint
-- (keeps the most recent record for each duplicate CPF)
DELETE FROM alunos a1
USING alunos a2
WHERE a1.cpf IS NOT NULL
  AND a1.cpf = a2.cpf
  AND a1.created_at < a2.created_at;

-- 2. Add partial unique index (only enforces uniqueness for non-null CPFs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_alunos_cpf_unique 
  ON alunos (cpf) 
  WHERE cpf IS NOT NULL AND cpf != '';

-- 3. Helper function to validate CPF format (Brazilian algorithm)
CREATE OR REPLACE FUNCTION validate_cpf(p_cpf TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  digits INTEGER[];
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  remainder1 INTEGER;
  remainder2 INTEGER;
  i INTEGER;
  clean_cpf TEXT;
BEGIN
  -- Remove non-digits
  clean_cpf := regexp_replace(p_cpf, '[^0-9]', '', 'g');
  
  -- Must be 11 digits
  IF length(clean_cpf) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for all same digits (e.g., 111.111.111-11)
  IF clean_cpf ~ '^(\d)\1{10}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Convert to integer array
  FOR i IN 1..11 LOOP
    digits[i] := substring(clean_cpf, i, 1)::INTEGER;
  END LOOP;
  
  -- First check digit
  FOR i IN 1..9 LOOP
    sum1 := sum1 + digits[i] * (11 - i);
  END LOOP;
  remainder1 := (sum1 * 10) % 11;
  IF remainder1 = 10 THEN remainder1 := 0; END IF;
  IF remainder1 != digits[10] THEN RETURN FALSE; END IF;
  
  -- Second check digit
  FOR i IN 1..10 LOOP
    sum2 := sum2 + digits[i] * (12 - i);
  END LOOP;
  remainder2 := (sum2 * 10) % 11;
  IF remainder2 = 10 THEN remainder2 := 0; END IF;
  IF remainder2 != digits[11] THEN RETURN FALSE; END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Add CHECK constraint for CPF format validation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'alunos_cpf_valid_format'
  ) THEN
    ALTER TABLE alunos 
      ADD CONSTRAINT alunos_cpf_valid_format 
      CHECK (cpf IS NULL OR cpf = '' OR (length(cpf) = 11 AND cpf ~ '^\d{11}$'));
  END IF;
END $$;
