-- Create ENUM for contact types
DO $$ BEGIN
    CREATE TYPE tipo_contato AS ENUM ('ligacao', 'whatsapp', 'email', 'reuniao', 'cobranca', 'outro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create contact_logs table
CREATE TABLE IF NOT EXISTS public.contact_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL, -- Quem registrou o contato
    tipo tipo_contato NOT NULL DEFAULT 'outro',
    descricao TEXT NOT NULL,
    data_contato TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_logs ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. View Policies:
-- Direção, Coordenação, Professor can view logs.
DO $$ BEGIN
    CREATE POLICY "Staff can view contact logs"
    ON public.contact_logs
    FOR SELECT
    USING (
      auth.uid() IN (
        SELECT user_id FROM public.user_roles 
        WHERE role IN ('direcao', 'coordenacao', 'professor')
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Responsáveis should NOT view internal logs (CRM).

-- 2. Insert Policies:
-- Staff can insert logs.
DO $$ BEGIN
    CREATE POLICY "Staff can insert contact logs"
    ON public.contact_logs
    FOR INSERT
    WITH CHECK (
      auth.uid() IN (
        SELECT user_id FROM public.user_roles 
        WHERE role IN ('direcao', 'coordenacao', 'professor')
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Update/Delete Policies:
-- Only Direção (Admin) or the Author can update/delete their own logs.
DO $$ BEGIN
    CREATE POLICY "Authors or Direcao can update/delete logs"
    ON public.contact_logs
    FOR UPDATE
    USING (
      auth.uid() = user_id OR
      auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role = 'direcao'
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Authors or Direcao can delete logs"
    ON public.contact_logs
    FOR DELETE
    USING (
      auth.uid() = user_id OR
      auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role = 'direcao'
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_logs_aluno_id ON public.contact_logs(aluno_id);
CREATE INDEX IF NOT EXISTS idx_contact_logs_data_contato ON public.contact_logs(data_contato DESC);
