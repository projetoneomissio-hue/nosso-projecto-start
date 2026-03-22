-- PARTE 1: Executar este comando SOZINHO primeiro
ALTER TYPE public.status_solicitacao ADD VALUE 'interessado';

-- PARTE 2: Após a Parte 1 ter sido executada com sucesso, execute o restante:
ALTER TABLE public.solicitacoes_matricula 
ADD COLUMN IF NOT EXISTS sobrenome TEXT,
ADD COLUMN IF NOT EXISTS cpf_responsavel TEXT,
ADD COLUMN IF NOT EXISTS escola TEXT,
ADD COLUMN IF NOT EXISTS serie_ano TEXT,
ADD COLUMN IF NOT EXISTS necessidades_especiais TEXT,
ADD COLUMN IF NOT EXISTS como_conheceu TEXT,
ADD COLUMN IF NOT EXISTS autoriza_imagem BOOLEAN DEFAULT FALSE;

ALTER TABLE public.solicitacoes_matricula ALTER COLUMN status SET DEFAULT 'interessado';

COMMENT ON COLUMN public.solicitacoes_matricula.status IS 'Status da solicitação: interessado (Passo 1), pendente (Passo 2 completo), aprovada, rejeitada';
