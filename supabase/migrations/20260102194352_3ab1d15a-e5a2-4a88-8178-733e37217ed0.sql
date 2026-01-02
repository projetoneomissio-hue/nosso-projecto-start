-- Create comunicados table
CREATE TABLE public.comunicados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'geral', -- 'geral', 'turma', 'individual'
  turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  destinatario_id UUID, -- responsavel_id for individual messages
  canal TEXT[] NOT NULL DEFAULT ARRAY['email'], -- 'email', 'whatsapp', or both
  status TEXT NOT NULL DEFAULT 'rascunho', -- 'rascunho', 'enviado', 'parcial'
  enviado_em TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track individual send status
CREATE TABLE public.comunicado_envios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comunicado_id UUID NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL,
  canal TEXT NOT NULL, -- 'email' or 'whatsapp'
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'enviado', 'erro'
  erro_mensagem TEXT,
  enviado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicado_envios ENABLE ROW LEVEL SECURITY;

-- Policies for comunicados
CREATE POLICY "Direção e coordenação podem gerenciar comunicados"
ON public.comunicados FOR ALL
USING (has_role(auth.uid(), 'direcao'::app_role) OR has_role(auth.uid(), 'coordenacao'::app_role));

CREATE POLICY "Responsáveis podem ver comunicados destinados a eles"
ON public.comunicados FOR SELECT
USING (
  has_role(auth.uid(), 'responsavel'::app_role) AND (
    tipo = 'geral' OR
    destinatario_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM matriculas m
      JOIN alunos a ON m.aluno_id = a.id
      WHERE m.turma_id = comunicados.turma_id
      AND a.responsavel_id = auth.uid()
      AND m.status = 'ativa'
    )
  )
);

-- Policies for comunicado_envios
CREATE POLICY "Direção e coordenação podem ver envios"
ON public.comunicado_envios FOR ALL
USING (has_role(auth.uid(), 'direcao'::app_role) OR has_role(auth.uid(), 'coordenacao'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_comunicados_updated_at
BEFORE UPDATE ON public.comunicados
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Index for performance
CREATE INDEX idx_comunicados_tipo ON public.comunicados(tipo);
CREATE INDEX idx_comunicados_turma ON public.comunicados(turma_id);
CREATE INDEX idx_comunicado_envios_comunicado ON public.comunicado_envios(comunicado_id);
CREATE INDEX idx_comunicado_envios_status ON public.comunicado_envios(status);