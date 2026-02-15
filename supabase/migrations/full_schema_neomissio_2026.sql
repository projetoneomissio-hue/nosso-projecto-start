-- ============================================
-- NEO MISSIO - FULL DATABASE SCHEMA
-- Consolidation of all local migrations
-- Use this script to initialize the NeoMissio2026 project
-- ============================================

-- 1. ENUMS AND BASE TYPES
CREATE TYPE public.app_role AS ENUM ('direcao', 'coordenacao', 'professor', 'responsavel');
CREATE TYPE public.status_matricula AS ENUM ('pendente', 'ativa', 'cancelada', 'concluida');
CREATE TYPE public.status_pagamento AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');

-- 2. CORE TABLES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

CREATE TABLE public.atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_mensal DECIMAL(10,2) NOT NULL,
  capacidade_maxima INTEGER,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  especialidade TEXT,
  percentual_comissao DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID REFERENCES public.atividades(id) ON DELETE CASCADE NOT NULL,
  professor_id UUID REFERENCES public.professores(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  horario TEXT NOT NULL,
  dias_semana TEXT[] NOT NULL,
  capacidade_maxima INTEGER NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responsavel_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nome_completo TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  cpf TEXT UNIQUE,
  telefone TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status status_matricula NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(aluno_id, turma_id)
);

CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID REFERENCES public.matriculas(id) ON DELETE CASCADE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status status_pagamento NOT NULL DEFAULT 'pendente',
  forma_pagamento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.observacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  professor_id UUID REFERENCES public.professores(id) ON DELETE CASCADE NOT NULL,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  observacao TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID REFERENCES public.matriculas(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  presente BOOLEAN NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(matricula_id, data)
);

CREATE TABLE public.anamneses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tipo_sanguineo TEXT,
  alergias TEXT,
  medicamentos TEXT,
  condicoes_medicas TEXT,
  contato_emergencia_nome TEXT,
  contato_emergencia_telefone TEXT,
  contato_emergencia_relacao TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.custos_predio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('fixo', 'variavel')),
  data_competencia DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL,
  salario DECIMAL(10,2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.locacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento TEXT NOT NULL,
  data DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  responsavel_nome TEXT NOT NULL,
  responsavel_telefone TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comunicados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('geral', 'turma', 'aluno')),
  destinatario_id UUID,
  urgente BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  criado_por UUID REFERENCES auth.users(id)
);

-- 3. FUNCTIONS AND TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.atividades FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.professores FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.turmas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.alunos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.matriculas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.observacoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.anamneses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.custos_predio FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.locacoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Novo Usuário'),
    NEW.email
  );
  -- Default role: responsavel
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'responsavel');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. SECURITY DEFINER HELPERS (To bypass RLS in policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.get_alunos_by_responsavel(p_responsavel_id uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT id FROM public.alunos WHERE responsavel_id = p_responsavel_id;
$$;

CREATE OR REPLACE FUNCTION public.is_professor_aluno(p_user_id uuid, p_aluno_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.matriculas m
    JOIN public.turmas t ON m.turma_id = t.id
    JOIN public.professores p ON t.professor_id = p.id
    WHERE m.aluno_id = p_aluno_id AND p.user_id = p_user_id
  );
$$;

-- 5. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_receita_por_atividade()
RETURNS TABLE (nome TEXT, valor NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.nome,
    SUM(a.valor_mensal)::NUMERIC as valor
  FROM public.matriculas m
  JOIN public.turmas t ON m.turma_id = t.id
  JOIN public.atividades a ON t.atividade_id = a.id
  WHERE m.status = 'ativa'
  GROUP BY a.nome;
END;
$$;

-- 6. RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos_predio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

-- Add policies (simplified/consolidated)
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Management view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Direcao manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'direcao'));

CREATE POLICY "Everyone view active activities" ON public.atividades FOR SELECT USING (ativa = true OR has_role(auth.uid(), 'direcao'));
CREATE POLICY "Management manage activities" ON public.atividades FOR ALL USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Management manage professors" ON public.professores FOR ALL USING (has_role(auth.uid(), 'direcao'));

CREATE POLICY "Management manage turmas" ON public.turmas FOR ALL USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Responsaveis manage own students" ON public.alunos FOR ALL USING (auth.uid() = responsavel_id);
CREATE POLICY "Staff view all students" ON public.alunos FOR SELECT USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao') OR has_role(auth.uid(), 'professor'));

CREATE POLICY "Responsaveis view own matriculas" ON public.matriculas FOR SELECT USING (aluno_id IN (SELECT get_alunos_by_responsavel(auth.uid())));
CREATE POLICY "Management manage matriculas" ON public.matriculas FOR ALL USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Responsaveis view own pagamentos" ON public.pagamentos FOR SELECT USING (EXISTS (SELECT 1 FROM public.matriculas m WHERE m.id = pagamentos.matricula_id AND m.aluno_id IN (SELECT get_alunos_by_responsavel(auth.uid()))));
CREATE POLICY "Management manage pagamentos" ON public.pagamentos FOR ALL USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Responsaveis view own presencas" ON public.presencas FOR SELECT USING (EXISTS (SELECT 1 FROM public.matriculas m WHERE m.id = presencas.matricula_id AND m.aluno_id IN (SELECT get_alunos_by_responsavel(auth.uid()))));

-- 7. INDEXES
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_alunos_responsavel ON public.alunos(responsavel_id);
CREATE INDEX idx_matriculas_aluno ON public.matriculas(aluno_id);
CREATE INDEX idx_pagamentos_matricula ON public.pagamentos(matricula_id);
