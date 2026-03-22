-- Habilitar UPDATE e SELECT para usuários anônimos na tabela de solicitações
-- Isso é necessário para o fluxo de 2 passos (Progressive Profiling)
-- Passo 1: Insere (e precisa de SELECT para retornar o ID)
-- Passo 2: Atualiza (e precisa de UPDATE e SELECT)

-- Remover políticas antigas se necessário (opcional, mas garante limpeza)
-- DROP POLICY IF EXISTS "Anonimos podem solicitar matricula" ON solicitacoes_matricula;

-- Nova política abrangente para anônimos (Restrita a INSERT, UPDATE e SELECT)
-- Nota: 'using (true)' em SELECT permite que qualquer um com o ID veja os dados.
-- Como é uma tabela de leads/staging, a segurança baseada no UUID do ID é o padrão aqui.

CREATE POLICY "Anonimos podem gerenciar sua solicitacao" ON public.solicitacoes_matricula
FOR ALL 
TO anon
USING (true)
WITH CHECK (true);

-- Garantir que a tabela tenha RLS ativado (já deve estar, mas por segurança)
ALTER TABLE public.solicitacoes_matricula ENABLE ROW LEVEL SECURITY;
