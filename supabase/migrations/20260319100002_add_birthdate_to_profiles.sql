-- Migration: Add Birthdate to profiles
-- Purpose: Enable fuzzy matching (Name + Birthdate) for deduplication

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_nascimento DATE;
COMMENT ON COLUMN public.profiles.data_nascimento IS 'Date of birth of the user, used for fuzzy matching and identification';
