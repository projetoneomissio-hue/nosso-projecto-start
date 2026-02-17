-- ============================================================
-- SCRIPT CONSOLIDADO: Migrações Pendentes (Neo Missio)
-- Executar no Supabase SQL Editor em ordem
-- Data: 16/02/2026
-- ============================================================

-- ============================================================
-- 1. REFERRAL SYSTEM (20260216210000)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS codigo_indicacao TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS convidado_por UUID REFERENCES profiles(id);
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS origem_cadastro JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_profiles_codigo_indicacao ON profiles(codigo_indicacao);

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user_referral()
RETURNS TRIGGER AS $$
DECLARE
  referrer_code TEXT;
  referrer_id UUID;
  user_meta JSONB;
BEGIN
  IF NEW.codigo_indicacao IS NULL THEN
    LOOP
      NEW.codigo_indicacao := generate_referral_code();
      BEGIN
        EXIT;
      EXCEPTION WHEN unique_violation THEN
      END;
      EXIT WHEN NEW.codigo_indicacao IS NOT NULL; 
    END LOOP;
  END IF;

  SELECT raw_user_meta_data INTO user_meta
  FROM auth.users
  WHERE id = NEW.id;

  referrer_code := user_meta->>'referral_code';

  IF referrer_code IS NOT NULL THEN
    SELECT id INTO referrer_id FROM profiles WHERE codigo_indicacao = referrer_code;
    IF referrer_id IS NOT NULL THEN
      NEW.convidado_por := referrer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_handle_referral ON profiles;
CREATE TRIGGER trigger_handle_referral
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION handle_new_user_referral();

-- ============================================================
-- 2. AUDIT SYSTEM (20260216223000)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins podem ver logs de auditoria' AND tablename = 'audit_logs') THEN
    CREATE POLICY "Admins podem ver logs de auditoria" ON audit_logs
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM user_unidades WHERE user_id = auth.uid() AND role = 'direcao'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  old_row jsonb := null;
  new_row jsonb := null;
BEGIN
  IF (TG_OP = 'UPDATE') OR (TG_OP = 'DELETE') THEN
    old_row = to_jsonb(OLD);
  END IF;
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE') THEN
    new_row = to_jsonb(NEW);
  END IF;

  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, coalesce(NEW.id::text, OLD.id::text), old_row, new_row);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_pagamentos ON pagamentos;
CREATE TRIGGER audit_pagamentos AFTER INSERT OR UPDATE OR DELETE ON pagamentos FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_alunos ON alunos;
CREATE TRIGGER audit_alunos AFTER INSERT OR UPDATE OR DELETE ON alunos FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_matriculas ON matriculas;
CREATE TRIGGER audit_matriculas AFTER INSERT OR UPDATE OR DELETE ON matriculas FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_custos ON custos_predio;
CREATE TRIGGER audit_custos AFTER INSERT OR UPDATE OR DELETE ON custos_predio FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- ============================================================
-- 3. CALENDARIO ESCOLAR (20260216233000)
-- ============================================================
CREATE TABLE IF NOT EXISTS calendario_escolar (
  id uuid default gen_random_uuid() primary key,
  unidade_id uuid references unidades(id) not null,
  titulo text not null,
  descricao text,
  data_inicio date not null,
  data_fim date not null,
  tipo text check (tipo in ('feriado', 'recesso', 'evento', 'prova', 'reuniao')),
  eh_dia_letivo boolean default false,
  created_at timestamp with time zone default now()
);

CREATE INDEX IF NOT EXISTS idx_calendario_unidade_data ON calendario_escolar(unidade_id, data_inicio);

ALTER TABLE calendario_escolar ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ver calendario da sua unidade' AND tablename = 'calendario_escolar') THEN
    CREATE POLICY "Ver calendario da sua unidade" ON calendario_escolar
      FOR SELECT USING (unidade_id IN (SELECT unidade_id FROM user_unidades WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gerenciar calendario da sua unidade (Admin/Coord)' AND tablename = 'calendario_escolar') THEN
    CREATE POLICY "Gerenciar calendario da sua unidade (Admin/Coord)" ON calendario_escolar
      FOR ALL USING (unidade_id IN (SELECT unidade_id FROM user_unidades WHERE user_id = auth.uid() AND role IN ('direcao', 'coordenacao')));
  END IF;
END $$;

-- ============================================================
-- 4. MATRICULA ONLINE (20260216235900)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_solicitacao') THEN
    CREATE TYPE status_solicitacao AS ENUM ('pendente', 'aprovada', 'rejeitada');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS solicitacoes_matricula (
  id uuid default gen_random_uuid() primary key,
  nome_completo text not null,
  whatsapp text not null,
  data_nascimento date not null,
  unidade_id uuid references unidades(id) not null,
  status status_solicitacao default 'pendente',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

ALTER TABLE solicitacoes_matricula ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anonimos podem solicitar matricula' AND tablename = 'solicitacoes_matricula') THEN
    CREATE POLICY "Anonimos podem solicitar matricula" ON solicitacoes_matricula
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coordenação vê solicitações da sua unidade' AND tablename = 'solicitacoes_matricula') THEN
    CREATE POLICY "Coordenação vê solicitações da sua unidade" ON solicitacoes_matricula
      FOR ALL TO authenticated
      USING (unidade_id IN (SELECT unidade_id FROM user_unidades WHERE user_id = auth.uid()))
      WITH CHECK (unidade_id IN (SELECT unidade_id FROM user_unidades WHERE user_id = auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_solicitacoes_unidade ON solicitacoes_matricula(unidade_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes_matricula(status);

-- Policy pública para unidades (resolver slug -> id na matrícula online)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public view unidades' AND tablename = 'unidades') THEN
    CREATE POLICY "Public view unidades" ON unidades FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- ============================================================
-- 5. CERTIFICADOS (20260217004400)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_certificado') THEN
    CREATE TYPE status_certificado AS ENUM ('emitido', 'revogado');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS certificados (
  id uuid default gen_random_uuid() primary key,
  aluno_id uuid references alunos(id) not null,
  matricula_id uuid references matriculas(id) not null,
  unidade_id uuid references unidades(id) not null,
  codigo_validacao text not null unique,
  data_emissao date default now(),
  nome_curso text not null,
  carga_horaria_horas int,
  status status_certificado default 'emitido',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

CREATE INDEX IF NOT EXISTS idx_certificados_aluno ON certificados(aluno_id);
CREATE INDEX IF NOT EXISTS idx_certificados_matricula ON certificados(matricula_id);
CREATE INDEX IF NOT EXISTS idx_certificados_codigo ON certificados(codigo_validacao);

ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for authenticated users in same unit' AND tablename = 'certificados') THEN
    CREATE POLICY "Enable read access for authenticated users in same unit" ON certificados
      FOR SELECT TO authenticated
      USING (unidade_id IN (SELECT unidade_id FROM user_unidades WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert for authenticated users in same unit' AND tablename = 'certificados') THEN
    CREATE POLICY "Enable insert for authenticated users in same unit" ON certificados
      FOR INSERT TO authenticated
      WITH CHECK (unidade_id IN (SELECT unidade_id FROM user_unidades WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ============================================================
-- 6. VOLUNTARIOS (20260217020000)
-- ============================================================
ALTER TABLE public.professores ADD COLUMN IF NOT EXISTS is_volunteer BOOLEAN DEFAULT false NOT NULL;

-- ============================================================
-- FIM — Todas as migrações pendentes foram aplicadas!
-- Agora regenere o types.ts: npx supabase gen types typescript --project-id <ID> --schema public
-- ============================================================
