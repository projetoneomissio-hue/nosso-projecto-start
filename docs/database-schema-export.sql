-- ============================================
-- NEO MISSIO - SCRIPT COMPLETO DO BANCO DE DADOS
-- Gerado em: 2025-12-03
-- Para importar no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ENUMS (Tipos Personalizados)
-- ============================================

CREATE TYPE public.app_role AS ENUM ('direcao', 'coordenacao', 'professor', 'responsavel');
CREATE TYPE public.status_matricula AS ENUM ('pendente', 'ativa', 'cancelada', 'concluida');
CREATE TYPE public.status_pagamento AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');

-- ============================================
-- 2. TABELAS
-- ============================================

-- Profiles (dados dos usuários)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Roles (papéis dos usuários)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Alunos
CREATE TABLE public.alunos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  responsavel_id UUID NOT NULL REFERENCES public.profiles(id),
  nome_completo TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  cpf TEXT,
  telefone TEXT,
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Atividades
CREATE TABLE public.atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_mensal NUMERIC NOT NULL,
  capacidade_maxima INTEGER,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Professores
CREATE TABLE public.professores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id),
  especialidade TEXT,
  percentual_comissao NUMERIC NOT NULL DEFAULT 15.00,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Turmas
CREATE TABLE public.turmas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  atividade_id UUID NOT NULL REFERENCES public.atividades(id),
  professor_id UUID REFERENCES public.professores(id),
  nome TEXT NOT NULL,
  horario TEXT NOT NULL,
  dias_semana TEXT[] NOT NULL,
  capacidade_maxima INTEGER NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Matrículas
CREATE TABLE public.matriculas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id),
  turma_id UUID NOT NULL REFERENCES public.turmas(id),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status public.status_matricula NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pagamentos
CREATE TABLE public.pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id),
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status public.status_pagamento NOT NULL DEFAULT 'pendente',
  forma_pagamento TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Presenças
CREATE TABLE public.presencas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id),
  data DATE NOT NULL,
  presente BOOLEAN NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Anamneses
CREATE TABLE public.anamneses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL UNIQUE REFERENCES public.alunos(id),
  tipo_sanguineo TEXT,
  alergias TEXT,
  medicamentos TEXT,
  condicoes_medicas TEXT,
  contato_emergencia_nome TEXT,
  contato_emergencia_telefone TEXT,
  contato_emergencia_relacao TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Observações (dos professores sobre alunos)
CREATE TABLE public.observacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id),
  professor_id UUID NOT NULL REFERENCES public.professores(id),
  turma_id UUID NOT NULL REFERENCES public.turmas(id),
  tipo TEXT NOT NULL,
  observacao TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coordenador-Atividades (vínculo)
CREATE TABLE public.coordenador_atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coordenador_id UUID NOT NULL REFERENCES public.profiles(id),
  atividade_id UUID NOT NULL REFERENCES public.atividades(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coordenador_id, atividade_id)
);

-- Invitations (convites para roles privilegiados)
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role public.app_role NOT NULL,
  created_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Custos do Prédio
CREATE TABLE public.custos_predio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item TEXT NOT NULL,
  tipo TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_competencia DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Funcionários
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL,
  salario NUMERIC NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Locações
CREATE TABLE public.locacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evento TEXT NOT NULL,
  responsavel_nome TEXT NOT NULL,
  responsavel_telefone TEXT,
  data DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  valor NUMERIC NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MFA Recovery Codes
CREATE TABLE public.mfa_recovery_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 3. VIEWS
-- ============================================

-- View segura para alunos (mascara CPF)
CREATE OR REPLACE VIEW public.alunos_secure AS
SELECT 
  id,
  responsavel_id,
  nome_completo,
  data_nascimento,
  CASE 
    WHEN cpf IS NULL THEN NULL
    WHEN length(cpf) >= 4 THEN '***.***.***-' || right(cpf, 2)
    ELSE '***.***.***-**'
  END AS cpf,
  telefone,
  endereco,
  created_at,
  updated_at
FROM public.alunos;

-- ============================================
-- 4. FUNÇÕES
-- ============================================

-- Função para verificar se usuário tem role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
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

-- Função para verificar se é coordenador da atividade
CREATE OR REPLACE FUNCTION public.is_coordenador_atividade(_user_id UUID, _atividade_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.coordenador_atividades
    WHERE coordenador_id = _user_id
    AND atividade_id = _atividade_id
  );
$$;

-- Função para verificar se é coordenador da turma
CREATE OR REPLACE FUNCTION public.is_coordenador_turma(_user_id UUID, _turma_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.turmas t
    JOIN public.coordenador_atividades ca ON t.atividade_id = ca.atividade_id
    WHERE t.id = _turma_id
    AND ca.coordenador_id = _user_id
  );
$$;

-- Função para mascarar CPF
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN cpf_value IS NULL THEN NULL
    WHEN length(cpf_value) >= 4 THEN 
      '***.***.***-' || right(cpf_value, 2)
    ELSE '***.***.***-**'
  END;
$$;

-- Função para obter CPF (com controle de acesso)
CREATE OR REPLACE FUNCTION public.get_aluno_cpf(aluno_id UUID, cpf_value TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN has_role(auth.uid(), 'direcao'::app_role) THEN cpf_value
    ELSE mask_cpf(cpf_value)
  END;
$$;

-- Função para validar token de convite
CREATE OR REPLACE FUNCTION public.validate_invitation_token(_token TEXT, _email TEXT)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  UPDATE public.invitations
  SET used_at = now()
  WHERE token = _token
    AND email = _email
    AND used_at IS NULL
    AND expires_at > now()
  RETURNING role INTO _role;
  
  IF _role IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  RETURN _role;
END;
$$;

-- Função para validar código de recuperação MFA
CREATE OR REPLACE FUNCTION public.validate_recovery_code(_user_id UUID, _code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM public.mfa_recovery_codes 
    WHERE user_id = _user_id 
      AND code = _code 
      AND used_at IS NULL
  ) INTO code_exists;
  
  IF code_exists THEN
    UPDATE public.mfa_recovery_codes
    SET used_at = now()
    WHERE user_id = _user_id AND code = _code;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Função para criar perfil de novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Trigger para criar perfil quando usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_alunos_updated_at
  BEFORE UPDATE ON public.alunos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_atividades_updated_at
  BEFORE UPDATE ON public.atividades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_turmas_updated_at
  BEFORE UPDATE ON public.turmas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_matriculas_updated_at
  BEFORE UPDATE ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_pagamentos_updated_at
  BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_anamneses_updated_at
  BEFORE UPDATE ON public.anamneses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_observacoes_updated_at
  BEFORE UPDATE ON public.observacoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_professores_updated_at
  BEFORE UPDATE ON public.professores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_custos_predio_updated_at
  BEFORE UPDATE ON public.custos_predio
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_funcionarios_updated_at
  BEFORE UPDATE ON public.funcionarios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_locacoes_updated_at
  BEFORE UPDATE ON public.locacoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordenador_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos_predio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. POLÍTICAS RLS - PROFILES
-- ============================================

CREATE POLICY "Usuários podem ver seu próprio perfil"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Direção e coordenação podem ver todos os perfis"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

-- ============================================
-- 8. POLÍTICAS RLS - USER_ROLES
-- ============================================

CREATE POLICY "Usuários podem ver suas próprias roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Direção pode gerenciar roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'direcao'));

CREATE POLICY "Usuários podem criar role responsavel no signup"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id AND role = 'responsavel'::app_role);

CREATE POLICY "Sistema pode atribuir roles via convite"
ON public.user_roles FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM invitations
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    AND role = user_roles.role
    AND used_at IS NULL
    AND expires_at > now()
  )
);

-- ============================================
-- 9. POLÍTICAS RLS - ALUNOS
-- ============================================

CREATE POLICY "Responsáveis podem ver seus alunos"
ON public.alunos FOR SELECT
USING (auth.uid() = responsavel_id);

CREATE POLICY "Responsáveis podem criar alunos"
ON public.alunos FOR INSERT
WITH CHECK (auth.uid() = responsavel_id);

CREATE POLICY "Responsáveis podem atualizar seus alunos"
ON public.alunos FOR UPDATE
USING (auth.uid() = responsavel_id);

CREATE POLICY "Direção pode gerenciar alunos"
ON public.alunos FOR ALL
USING (has_role(auth.uid(), 'direcao'));

CREATE POLICY "Direção, coordenação e professores podem ver todos os alunos"
ON public.alunos FOR SELECT
USING (
  has_role(auth.uid(), 'direcao') OR 
  has_role(auth.uid(), 'coordenacao') OR 
  has_role(auth.uid(), 'professor')
);

-- ============================================
-- 10. POLÍTICAS RLS - ATIVIDADES
-- ============================================

CREATE POLICY "Usuários podem ver atividades conforme seu papel"
ON public.atividades FOR SELECT
USING (
  ativa = true OR 
  has_role(auth.uid(), 'direcao') OR 
  is_coordenador_atividade(auth.uid(), id)
);

CREATE POLICY "Direção e coordenação podem gerenciar atividades"
ON public.atividades FOR ALL
USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Coordenadores podem atualizar suas atividades"
ON public.atividades FOR UPDATE
USING (is_coordenador_atividade(auth.uid(), id));

-- ============================================
-- 11. POLÍTICAS RLS - TURMAS
-- ============================================

CREATE POLICY "Usuários podem ver turmas conforme seu papel"
ON public.turmas FOR SELECT
USING (
  ativa = true OR 
  has_role(auth.uid(), 'direcao') OR 
  has_role(auth.uid(), 'coordenacao') OR 
  EXISTS (
    SELECT 1 FROM professores p 
    WHERE p.id = turmas.professor_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Direção e coordenação podem gerenciar turmas"
ON public.turmas FOR ALL
USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Coordenadores podem gerenciar turmas de suas atividades"
ON public.turmas FOR ALL
USING (has_role(auth.uid(), 'coordenacao') AND is_coordenador_turma(auth.uid(), id));

-- ============================================
-- 12. POLÍTICAS RLS - MATRÍCULAS
-- ============================================

CREATE POLICY "Responsáveis podem ver matrículas de seus alunos"
ON public.matriculas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM alunos 
    WHERE alunos.id = matriculas.aluno_id AND alunos.responsavel_id = auth.uid()
  )
);

CREATE POLICY "Responsáveis podem criar matrículas para seus alunos"
ON public.matriculas FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM alunos 
    WHERE alunos.id = matriculas.aluno_id AND alunos.responsavel_id = auth.uid()
  )
);

CREATE POLICY "Direção e coordenação podem gerenciar matrículas"
ON public.matriculas FOR ALL
USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Coordenadores podem ver matrículas de suas turmas"
ON public.matriculas FOR SELECT
USING (has_role(auth.uid(), 'coordenacao') AND is_coordenador_turma(auth.uid(), turma_id));

CREATE POLICY "Professores podem ver matrículas de suas turmas"
ON public.matriculas FOR SELECT
USING (is_professor_turma(auth.uid(), turma_id));

-- ============================================
-- 13. POLÍTICAS RLS - PAGAMENTOS
-- ============================================

CREATE POLICY "Responsáveis podem ver pagamentos de seus alunos"
ON public.pagamentos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matriculas m
    JOIN alunos a ON m.aluno_id = a.id
    WHERE m.id = pagamentos.matricula_id AND a.responsavel_id = auth.uid()
  )
);

CREATE POLICY "Direção e coordenação podem gerenciar pagamentos"
ON public.pagamentos FOR ALL
USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Coordenadores podem ver pagamentos de suas turmas"
ON public.pagamentos FOR SELECT
USING (
  has_role(auth.uid(), 'coordenacao') AND 
  EXISTS (
    SELECT 1 FROM matriculas m
    WHERE m.id = pagamentos.matricula_id AND is_coordenador_turma(auth.uid(), m.turma_id)
  )
);

-- ============================================
-- 14. POLÍTICAS RLS - PRESENÇAS
-- ============================================

CREATE POLICY "Responsáveis podem ver presenças de seus alunos"
ON public.presencas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matriculas m
    JOIN alunos a ON m.aluno_id = a.id
    WHERE m.id = presencas.matricula_id AND a.responsavel_id = auth.uid()
  )
);

CREATE POLICY "Direção e coordenação podem ver todas as presenças"
ON public.presencas FOR SELECT
USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Professores podem registrar presença em suas turmas"
ON public.presencas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM matriculas m
    WHERE m.id = presencas.matricula_id AND is_professor_turma(auth.uid(), m.turma_id)
  )
);

CREATE POLICY "Coordenadores podem ver presenças de suas turmas"
ON public.presencas FOR SELECT
USING (
  has_role(auth.uid(), 'coordenacao') AND 
  EXISTS (
    SELECT 1 FROM matriculas m
    WHERE m.id = presencas.matricula_id AND is_coordenador_turma(auth.uid(), m.turma_id)
  )
);

-- ============================================
-- 15. POLÍTICAS RLS - ANAMNESES
-- ============================================

CREATE POLICY "Responsáveis podem gerenciar anamneses de seus alunos"
ON public.anamneses FOR ALL
USING (is_responsavel_aluno(auth.uid(), aluno_id));

CREATE POLICY "Direção e coordenação podem ver todas as anamneses"
ON public.anamneses FOR SELECT
USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Professores podem ver anamneses"
ON public.anamneses FOR SELECT
USING (has_role(auth.uid(), 'professor'));

-- ============================================
-- 16. POLÍTICAS RLS - OBSERVAÇÕES
-- ============================================

CREATE POLICY "Responsáveis podem ver observações de seus alunos"
ON public.observacoes FOR SELECT
USING (is_responsavel_aluno(auth.uid(), aluno_id));

CREATE POLICY "Direção e coordenação podem ver todas as observações"
ON public.observacoes FOR SELECT
USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Professores podem criar observações para suas turmas"
ON public.observacoes FOR INSERT
WITH CHECK (is_professor_turma(auth.uid(), turma_id));

CREATE POLICY "Professores podem ver e editar suas observações"
ON public.observacoes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM professores
    WHERE professores.id = observacoes.professor_id AND professores.user_id = auth.uid()
  )
);

-- ============================================
-- 17. POLÍTICAS RLS - PROFESSORES
-- ============================================

CREATE POLICY "Todos podem ver professores"
ON public.professores FOR SELECT
USING (true);

CREATE POLICY "Direção pode gerenciar professores"
ON public.professores FOR ALL
USING (has_role(auth.uid(), 'direcao'));

CREATE POLICY "Professores podem atualizar seus dados"
ON public.professores FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- 18. POLÍTICAS RLS - COORDENADOR_ATIVIDADES
-- ============================================

CREATE POLICY "Coordenadores podem ver suas atividades"
ON public.coordenador_atividades FOR SELECT
USING (coordenador_id = auth.uid());

CREATE POLICY "Direção pode gerenciar coordenador_atividades"
ON public.coordenador_atividades FOR ALL
USING (has_role(auth.uid(), 'direcao'));

-- ============================================
-- 19. POLÍTICAS RLS - INVITATIONS
-- ============================================

CREATE POLICY "Direção pode ver convites"
ON public.invitations FOR SELECT
USING (has_role(auth.uid(), 'direcao'));

CREATE POLICY "Direção pode criar convites"
ON public.invitations FOR INSERT
WITH CHECK (has_role(auth.uid(), 'direcao'));

CREATE POLICY "Direção pode deletar convites"
ON public.invitations FOR DELETE
USING (has_role(auth.uid(), 'direcao'));

CREATE POLICY "Usuários não autenticados podem validar tokens"
ON public.invitations FOR SELECT
USING (used_at IS NULL AND expires_at > now());

-- ============================================
-- 20. POLÍTICAS RLS - CUSTOS_PREDIO
-- ============================================

CREATE POLICY "Direção pode gerenciar custos"
ON public.custos_predio FOR ALL
USING (has_role(auth.uid(), 'direcao'));

CREATE POLICY "Coordenação pode ver custos"
ON public.custos_predio FOR SELECT
USING (has_role(auth.uid(), 'coordenacao'));

-- ============================================
-- 21. POLÍTICAS RLS - FUNCIONÁRIOS
-- ============================================

CREATE POLICY "Direção pode gerenciar funcionários"
ON public.funcionarios FOR ALL
USING (has_role(auth.uid(), 'direcao'));

CREATE POLICY "Coordenação pode ver funcionários"
ON public.funcionarios FOR SELECT
USING (has_role(auth.uid(), 'coordenacao'));

-- ============================================
-- 22. POLÍTICAS RLS - LOCAÇÕES
-- ============================================

CREATE POLICY "Direção e coordenação podem gerenciar locações"
ON public.locacoes FOR ALL
USING (has_role(auth.uid(), 'direcao') OR has_role(auth.uid(), 'coordenacao'));

-- ============================================
-- 23. POLÍTICAS RLS - MFA_RECOVERY_CODES
-- ============================================

CREATE POLICY "Usuários podem ver seus próprios códigos de recuperação"
ON public.mfa_recovery_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios códigos"
ON public.mfa_recovery_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus códigos"
ON public.mfa_recovery_codes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Para importar:
-- 1. Crie um projeto no supabase.com
-- 2. Vá em SQL Editor
-- 3. Cole este script e execute
-- 4. Configure as variáveis de ambiente no Lovable
-- ============================================
