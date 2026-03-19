-- Migration: Add CPF to profiles
-- Purpose: Enable unique identification of responsible parties (parents)

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf_unique ON public.profiles (cpf) WHERE cpf IS NOT NULL AND cpf != '';

COMMENT ON COLUMN public.profiles.cpf IS 'CPF of the user (responsible party), used for deduplication and identification';
