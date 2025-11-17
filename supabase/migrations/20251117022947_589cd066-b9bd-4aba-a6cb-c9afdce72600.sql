-- Criar enum para tipos de usuários
CREATE TYPE public.app_role AS ENUM ('direcao', 'coordenacao', 'professor', 'responsavel');

-- Criar enum para status
CREATE TYPE public.status_matricula AS ENUM ('pendente', 'ativa', 'cancelada', 'concluida');
CREATE TYPE public.status_pagamento AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de roles dos usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Tabela de atividades
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

-- Tabela de professores
CREATE TABLE public.professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  especialidade TEXT,
  percentual_comissao DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de turmas
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

-- Tabela de alunos
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

-- Tabela de matrículas
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

-- Tabela de pagamentos
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

-- Tabela de observações dos professores
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

-- Tabela de presença
CREATE TABLE public.presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID REFERENCES public.matriculas(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  presente BOOLEAN NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(matricula_id, data)
);

-- Tabela de anamnese
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

-- Tabela de custos do prédio
CREATE TABLE public.custos_predio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('fixo', 'variavel')),
  data_competencia DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de funcionários
CREATE TABLE public.funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL,
  salario DECIMAL(10,2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de locações do prédio
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

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
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

-- Função para criar perfil automaticamente
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
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil ao criar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função de segurança para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  );
$$;

-- Função para verificar se é responsável do aluno
CREATE OR REPLACE FUNCTION public.is_responsavel_aluno(_user_id UUID, _aluno_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.alunos
    WHERE id = _aluno_id
    AND responsavel_id = _user_id
  );
$$;

-- Função para verificar se é professor da turma
CREATE OR REPLACE FUNCTION public.is_professor_turma(_user_id UUID, _turma_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.turmas t
    JOIN public.professores p ON t.professor_id = p.id
    WHERE t.id = _turma_id
    AND p.user_id = _user_id
  );
$$;

-- HABILITAR RLS EM TODAS AS TABELAS
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

-- POLÍTICAS RLS - Profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Direção e coordenação podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'direcao') OR
    public.has_role(auth.uid(), 'coordenacao')
  );

-- POLÍTICAS RLS - User Roles
CREATE POLICY "Usuários podem ver suas próprias roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Direção pode gerenciar roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'direcao'));

-- POLÍTICAS RLS - Atividades
CREATE POLICY "Todos podem ver atividades ativas"
  ON public.atividades FOR SELECT
  USING (ativa = true OR public.has_role(auth.uid(), 'direcao') OR public.has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Direção e coordenação podem gerenciar atividades"
  ON public.atividades FOR ALL
  USING (public.has_role(auth.uid(), 'direcao') OR public.has_role(auth.uid(), 'coordenacao'));

-- POLÍTICAS RLS - Professores
CREATE POLICY "Todos podem ver professores"
  ON public.professores FOR SELECT
  USING (true);

CREATE POLICY "Professores podem atualizar seus dados"
  ON public.professores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Direção pode gerenciar professores"
  ON public.professores FOR ALL
  USING (public.has_role(auth.uid(), 'direcao'));

-- POLÍTICAS RLS - Turmas
CREATE POLICY "Todos podem ver turmas ativas"
  ON public.turmas FOR SELECT
  USING (ativa = true OR public.has_role(auth.uid(), 'direcao') OR public.has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Direção e coordenação podem gerenciar turmas"
  ON public.turmas FOR ALL
  USING (public.has_role(auth.uid(), 'direcao') OR public.has_role(auth.uid(), 'coordenacao'));

-- POLÍTICAS RLS - Alunos
CREATE POLICY "Responsáveis podem ver seus alunos"
  ON public.alunos FOR SELECT
  USING (auth.uid() = responsavel_id);

CREATE POLICY "Responsáveis podem criar alunos"
  ON public.alunos FOR INSERT
  WITH CHECK (auth.uid() = responsavel_id);

CREATE POLICY "Responsáveis podem atualizar seus alunos"
  ON public.alunos FOR UPDATE
  USING (auth.uid() = responsavel_id);

CREATE POLICY "Direção, coordenação e professores podem ver todos os alunos"
  ON public.alunos FOR SELECT
  USING (
    public.has_role(auth.uid(), 'direcao') OR
    public.has_role(auth.uid(), 'coordenacao') OR
    public.has_role(auth.uid(), 'professor')
  );

CREATE POLICY "Direção pode gerenciar alunos"
  ON public.alunos FOR ALL
  USING (public.has_role(auth.uid(), 'direcao'));

-- POLÍTICAS RLS - Matrículas
CREATE POLICY "Responsáveis podem ver matrículas de seus alunos"
  ON public.matriculas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alunos
      WHERE alunos.id = matriculas.aluno_id
      AND alunos.responsavel_id = auth.uid()
    )
  );

CREATE POLICY "Responsáveis podem criar matrículas para seus alunos"
  ON public.matriculas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.alunos
      WHERE alunos.id = aluno_id
      AND alunos.responsavel_id = auth.uid()
    )
  );

CREATE POLICY "Direção e coordenação podem gerenciar matrículas"
  ON public.matriculas FOR ALL
  USING (public.has_role(auth.uid(), 'direcao') OR public.has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Professores podem ver matrículas de suas turmas"
  ON public.matriculas FOR SELECT
  USING (public.is_professor_turma(auth.uid(), turma_id));

-- POLÍTICAS RLS - Pagamentos
CREATE POLICY "Responsáveis podem ver pagamentos de seus alunos"
  ON public.pagamentos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matriculas m
      JOIN public.alunos a ON m.aluno_id = a.id
      WHERE m.id = pagamentos.matricula_id
      AND a.responsavel_id = auth.uid()
    )
  );

CREATE POLICY "Direção e coordenação podem gerenciar pagamentos"
  ON public.pagamentos FOR ALL
  USING (public.has_role(auth.uid(), 'direcao') OR public.has_role(auth.uid(), 'coordenacao'));

-- POLÍTICAS RLS - Observações
CREATE POLICY "Professores podem criar observações para suas turmas"
  ON public.observacoes FOR INSERT
  WITH CHECK (public.is_professor_turma(auth.uid(), turma_id));

CREATE POLICY "Professores podem ver e editar suas observações"
  ON public.observacoes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.professores
      WHERE professores.id = observacoes.professor_id
      AND professores.user_id = auth.uid()
    )
  );

CREATE POLICY "Responsáveis podem ver observações de seus alunos"
  ON public.observacoes FOR SELECT
  USING (public.is_responsavel_aluno(auth.uid(), aluno_id));

CREATE POLICY "Direção e coordenação podem ver todas as observações"
  ON public.observacoes FOR SELECT
  USING (public.has_role(auth.uid(), 'direcao') OR public.has_role(auth.uid(), 'coordenacao'));

-- POLÍTICAS RLS - Presenças
CREATE POLICY "Professores podem registrar presença em suas turmas"
  ON public.presencas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.matriculas m
      WHERE m.id = presencas.matricula_id
      AND public.is_professor_turma(auth.uid(), m.turma_id)
    )
  );

CREATE POLICY "Responsáveis podem ver presenças de seus alunos"
  ON public.presencas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matriculas m
      JOIN public.alunos a ON m.aluno_id = a.id
      WHERE m.id = presencas.matricula_id
      AND a.responsavel_id = auth.uid()
    )
  );

CREATE POLICY "Direção e coordenação podem ver todas as presenças"
  ON public.presencas FOR SELECT
  USING (public.has_role(auth.uid(), 'direcao') OR public.has_role(auth.uid(), 'coordenacao'));

-- POLÍTICAS RLS - Anamneses
CREATE POLICY "Responsáveis podem gerenciar anamneses de seus alunos"
  ON public.anamneses FOR ALL
  USING (public.is_responsavel_aluno(auth.uid(), aluno_id));

CREATE POLICY "Professores podem ver anamneses"
  ON public.anamneses FOR SELECT
  USING (public.has_role(auth.uid(), 'professor'));

CREATE POLICY "Direção e coordenação podem ver todas as anamneses"
  ON public.anamneses FOR SELECT
  USING (public.has_role(auth.uid(), 'direcao') OR public.has_role(auth.uid(), 'coordenacao'));

-- POLÍTICAS RLS - Custos do Prédio
CREATE POLICY "Direção pode gerenciar custos"
  ON public.custos_predio FOR ALL
  USING (public.has_role(auth.uid(), 'direcao'));

CREATE POLICY "Coordenação pode ver custos"
  ON public.custos_predio FOR SELECT
  USING (public.has_role(auth.uid(), 'coordenacao'));

-- POLÍTICAS RLS - Funcionários
CREATE POLICY "Direção pode gerenciar funcionários"
  ON public.funcionarios FOR ALL
  USING (public.has_role(auth.uid(), 'direcao'));

CREATE POLICY "Coordenação pode ver funcionários"
  ON public.funcionarios FOR SELECT
  USING (public.has_role(auth.uid(), 'coordenacao'));

-- POLÍTICAS RLS - Locações
CREATE POLICY "Direção e coordenação podem gerenciar locações"
  ON public.locacoes FOR ALL
  USING (public.has_role(auth.uid(), 'direcao') OR public.has_role(auth.uid(), 'coordenacao'));

-- Criar índices para performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_alunos_responsavel ON public.alunos(responsavel_id);
CREATE INDEX idx_matriculas_aluno ON public.matriculas(aluno_id);
CREATE INDEX idx_matriculas_turma ON public.matriculas(turma_id);
CREATE INDEX idx_pagamentos_matricula ON public.pagamentos(matricula_id);
CREATE INDEX idx_observacoes_aluno ON public.observacoes(aluno_id);
CREATE INDEX idx_observacoes_professor ON public.observacoes(professor_id);
CREATE INDEX idx_presencas_matricula ON public.presencas(matricula_id);
CREATE INDEX idx_turmas_professor ON public.turmas(professor_id);
CREATE INDEX idx_turmas_atividade ON public.turmas(atividade_id);