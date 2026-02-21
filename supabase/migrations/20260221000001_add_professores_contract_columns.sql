-- Migration: Add Contract columns to professores table
-- Description: Adds tipo_contrato, valor_fixo, and is_volunteer columns to support fixed salaries.

-- 1. Check if the type exists, and if not, create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_contrato_professor') THEN
        CREATE TYPE public.tipo_contrato_professor AS ENUM ('parceiro', 'fixo', 'voluntario');
    END IF;
END$$;

-- 2. Add columns to public.professores if they don't exist
DO $$ 
BEGIN
    -- tipo_contrato
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'professores' 
          AND column_name = 'tipo_contrato'
    ) THEN
        ALTER TABLE public.professores ADD COLUMN tipo_contrato TEXT DEFAULT 'parceiro';
    END IF;

    -- valor_fixo
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'professores' 
          AND column_name = 'valor_fixo'
    ) THEN
        ALTER TABLE public.professores ADD COLUMN valor_fixo NUMERIC DEFAULT 0;
    END IF;

    -- is_volunteer
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'professores' 
          AND column_name = 'is_volunteer'
    ) THEN
        ALTER TABLE public.professores ADD COLUMN is_volunteer BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Notify PostgREST to refresh its schema cache 
NOTIFY pgrst, 'reload schema';
