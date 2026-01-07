-- Add scheduling fields to comunicados table
ALTER TABLE public.comunicados 
ADD COLUMN agendado_para TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN recorrencia TEXT DEFAULT NULL; -- 'diario', 'semanal', 'mensal', null para envio único

-- Create index for scheduled communications
CREATE INDEX idx_comunicados_agendado ON public.comunicados(agendado_para) WHERE agendado_para IS NOT NULL AND status = 'rascunho';

COMMENT ON COLUMN public.comunicados.agendado_para IS 'Data/hora para envio agendado do comunicado';
COMMENT ON COLUMN public.comunicados.recorrencia IS 'Tipo de recorrência: diario, semanal, mensal, ou null para envio único';