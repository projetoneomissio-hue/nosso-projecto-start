-- Criar tabela para mapear coordenadores a atividades
CREATE TABLE public.coordenador_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coordenador_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  atividade_id uuid NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(coordenador_id, atividade_id)
);

-- Enable RLS
ALTER TABLE public.coordenador_atividades ENABLE ROW LEVEL SECURITY;

-- Políticas para coordenador_atividades
CREATE POLICY "Direção pode gerenciar coordenador_atividades"
ON public.coordenador_atividades
FOR ALL
USING (has_role(auth.uid(), 'direcao'::app_role));

CREATE POLICY "Coordenadores podem ver suas atividades"
ON public.coordenador_atividades
FOR SELECT
USING (coordenador_id = auth.uid());

-- Função para verificar se usuário é coordenador de uma atividade
CREATE OR REPLACE FUNCTION public.is_coordenador_atividade(_user_id uuid, _atividade_id uuid)
RETURNS boolean
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

-- Função para verificar se usuário é coordenador de uma turma
CREATE OR REPLACE FUNCTION public.is_coordenador_turma(_user_id uuid, _turma_id uuid)
RETURNS boolean
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

-- Atualizar política de turmas para incluir coordenadores
DROP POLICY IF EXISTS "Todos podem ver turmas ativas" ON public.turmas;

CREATE POLICY "Usuários podem ver turmas conforme seu papel"
ON public.turmas
FOR SELECT
USING (
  ativa = true 
  OR has_role(auth.uid(), 'direcao'::app_role) 
  OR has_role(auth.uid(), 'coordenacao'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.professores p 
    WHERE p.id = turmas.professor_id AND p.user_id = auth.uid()
  )
);

-- Atualizar política de atividades para incluir coordenadores
DROP POLICY IF EXISTS "Todos podem ver atividades ativas" ON public.atividades;

CREATE POLICY "Usuários podem ver atividades conforme seu papel"
ON public.atividades
FOR SELECT
USING (
  ativa = true
  OR has_role(auth.uid(), 'direcao'::app_role)
  OR is_coordenador_atividade(auth.uid(), id)
);

-- Coordenadores podem gerenciar suas atividades
CREATE POLICY "Coordenadores podem atualizar suas atividades"
ON public.atividades
FOR UPDATE
USING (is_coordenador_atividade(auth.uid(), id));

-- Coordenadores podem gerenciar turmas de suas atividades
CREATE POLICY "Coordenadores podem gerenciar turmas de suas atividades"
ON public.turmas
FOR ALL
USING (
  has_role(auth.uid(), 'coordenacao'::app_role) 
  AND is_coordenador_turma(auth.uid(), id)
);

-- Atualizar política de matrículas para coordenadores
CREATE POLICY "Coordenadores podem ver matrículas de suas turmas"
ON public.matriculas
FOR SELECT
USING (
  has_role(auth.uid(), 'coordenacao'::app_role)
  AND is_coordenador_turma(auth.uid(), turma_id)
);

-- Coordenadores podem gerenciar pagamentos de suas turmas
CREATE POLICY "Coordenadores podem ver pagamentos de suas turmas"
ON public.pagamentos
FOR SELECT
USING (
  has_role(auth.uid(), 'coordenacao'::app_role)
  AND EXISTS (
    SELECT 1 FROM matriculas m
    WHERE m.id = pagamentos.matricula_id
    AND is_coordenador_turma(auth.uid(), m.turma_id)
  )
);

-- Coordenadores podem ver presenças de suas turmas
CREATE POLICY "Coordenadores podem ver presenças de suas turmas"
ON public.presencas
FOR SELECT
USING (
  has_role(auth.uid(), 'coordenacao'::app_role)
  AND EXISTS (
    SELECT 1 FROM matriculas m
    WHERE m.id = presencas.matricula_id
    AND is_coordenador_turma(auth.uid(), m.turma_id)
  )
);

-- Adicionar trigger para updated_at em coordenador_atividades
CREATE TRIGGER handle_coordenador_atividades_updated_at
BEFORE UPDATE ON public.coordenador_atividades
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();