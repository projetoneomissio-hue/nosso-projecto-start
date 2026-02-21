-- =============================================
-- Migration: Add missing fields for Audit 3.0
-- (Based on manual registration form)
-- =============================================

-- 1. Update Alunos Table
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS rg TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS escola TEXT,
ADD COLUMN IF NOT EXISTS serie_ano TEXT,
ADD COLUMN IF NOT EXISTS profissao TEXT,
ADD COLUMN IF NOT EXISTS autoriza_imagem BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS declaracao_assinada BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS grau_parentesco TEXT;

-- 2. Update Profiles (for Responsible data)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profissao TEXT,
ADD COLUMN IF NOT EXISTS nivel_ensino TEXT;

-- 3. Update Anamneses (Health info)
ALTER TABLE public.anamneses
ADD COLUMN IF NOT EXISTS is_pne BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pne_descricao TEXT,
ADD COLUMN IF NOT EXISTS doenca_cronica TEXT;

-- Update updated_at trigger for consistency (already exists but keeping schema integrity)
COMMENT ON COLUMN public.alunos.rg IS 'Registro Geral do Aluno';
COMMENT ON COLUMN public.alunos.bairro IS 'Bairro de residência';
COMMENT ON COLUMN public.alunos.autoriza_imagem IS 'Autorização de uso de imagem';
