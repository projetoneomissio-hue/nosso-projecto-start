-- Add PNE extended fields to anamneses (CID code and laudo boolean)
-- These fields are shown in the UI but were missing from the schema.
ALTER TABLE public.anamneses
ADD COLUMN IF NOT EXISTS pne_cid TEXT,
ADD COLUMN IF NOT EXISTS pne_laudo BOOLEAN DEFAULT FALSE;
