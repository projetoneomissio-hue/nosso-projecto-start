-- Migration: Add atividade_desejada to solicitacoes_matricula
-- Permite saber qual atividade o usuário clicou na landing page

ALTER TABLE public.solicitacoes_matricula 
ADD COLUMN IF NOT EXISTS atividade_desejada TEXT;

COMMENT ON COLUMN public.solicitacoes_matricula.atividade_desejada IS 'Nome da atividade que o usuário selecionou na landing page';
