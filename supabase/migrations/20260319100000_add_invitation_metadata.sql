-- Migration: Add metadata to invitations
-- Purpose: Store pending student info and other context for the invitation flow

ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.invitations.metadata IS 'Stores pending enrollment data (e.g. students to be created after registration)';
