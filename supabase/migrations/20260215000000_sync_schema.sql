-- ============================================
-- NEO MISSIO - SCHEMA SYNCHRONIZATION
-- Fixes missing tables, columns, and functions
-- Required for MFA, Communications, and Photos
-- ============================================

-- 1. MFA RECOVERY CODES
CREATE TABLE IF NOT EXISTS public.mfa_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user_id ON public.mfa_recovery_codes(user_id);
ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users view own recovery codes" ON public.mfa_recovery_codes FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users create own recovery codes" ON public.mfa_recovery_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users update own recovery codes" ON public.mfa_recovery_codes FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.validate_recovery_code(_user_id UUID, _code TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE code_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.mfa_recovery_codes WHERE user_id = _user_id AND code = _code AND used_at IS NULL) INTO code_exists;
  IF code_exists THEN
    UPDATE public.mfa_recovery_codes SET used_at = now() WHERE user_id = _user_id AND code = _code;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END; $$;

-- 2. INVITATIONS
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role app_role NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Management manage invitations" ON public.invitations FOR ALL USING (has_role(auth.uid(), 'direcao'));
  CREATE POLICY "Anon validate tokens" ON public.invitations FOR SELECT TO anon USING (used_at IS NULL AND expires_at > now());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.validate_invitation_token(_token TEXT, _email TEXT)
RETURNS app_role LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role app_role;
BEGIN
  UPDATE public.invitations SET used_at = now() WHERE token = _token AND email = _email AND used_at IS NULL AND expires_at > now() RETURNING role INTO _role;
  IF _role IS NULL THEN RAISE EXCEPTION 'Invalid or expired invitation token'; END IF;
  RETURN _role;
END; $$;

-- 3. COMUNICADOS UPDATE & ENVIOS
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS mensagem TEXT;
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL;
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS canal TEXT[] NOT NULL DEFAULT ARRAY['email'];
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'rascunho';
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS agendado_para TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS recorrencia TEXT;
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS created_by UUID;

CREATE TABLE IF NOT EXISTS public.comunicado_envios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicado_id UUID NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL,
  canal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  erro_mensagem TEXT,
  enviado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comunicado_envios ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Management view envios" ON public.comunicado_envios FOR ALL USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. MISSING COLUMNS
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.pagamentos ADD COLUMN IF NOT EXISTS ultimo_aviso_data DATE;

-- 5. FREQUENCIA (Attendance)
CREATE TABLE IF NOT EXISTS public.frequencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  presente BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.frequencia ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Management view all frequencia" ON public.frequencia FOR SELECT USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));
  CREATE POLICY "Professors manage own frequencia" ON public.frequencia FOR ALL USING (EXISTS (SELECT 1 FROM matriculas m JOIN turmas t ON m.turma_id = t.id WHERE m.id = frequencia.matricula_id AND t.professor_id = (SELECT id FROM professores WHERE user_id = auth.uid())));
  CREATE POLICY "Responsaveis view dependents frequencia" ON public.frequencia FOR SELECT USING (EXISTS (SELECT 1 FROM matriculas m JOIN alunos a ON m.aluno_id = a.id WHERE m.id = frequencia.matricula_id AND a.responsavel_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public Select Photos" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'student-photos' );
  CREATE POLICY "Authenticated Upload Photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'student-photos' );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_aluno_responsavel_id(p_aluno_id uuid) RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT responsavel_id FROM public.alunos WHERE id = p_aluno_id;
$$;
