
-- SOLUÇÃO PARA O ERRO 406 E VISIBILIDADE DO PROFESSOR
-- Este script limpa as políticas conflitantes e garante acesso ao perfil e turmas.

-- 1. Resetar permissões da tabela de Professores
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ver professores" ON public.professores;
DROP POLICY IF EXISTS "Professores veem seu proprio perfil" ON public.professores;
DROP POLICY IF EXISTS "Admins veem todos professores" ON public.professores;
DROP POLICY IF EXISTS "Apenas Direcao edita contratos financeiros" ON public.professores;

-- Política de Leitura: Qualquer pessoa autenticada pode ver a lista básica de professores 
-- (necessário para o sistema funcionar em diversos lugares)
CREATE POLICY "Leitura simplificada de professores" 
ON public.professores FOR SELECT 
TO authenticated 
USING (true);

-- Política de Edição: Apenas o próprio professor ou Admins
CREATE POLICY "Edição de perfil de professor" 
ON public.professores FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('direcao', 'coordenacao')))
WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('direcao', 'coordenacao')));


-- 2. Resetar permissões da tabela de Turmas
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ver turmas ativas" ON public.turmas;
DROP POLICY IF EXISTS "Direção e coordenação podem gerenciar turmas" ON public.turmas;
DROP POLICY IF EXISTS "Professores veem suas turmas" ON public.turmas;

-- Leitura: Professores veem as turmas que eles ministram OU qualquer um vê turmas ativas
CREATE POLICY "Acesso as turmas" 
ON public.turmas FOR SELECT 
TO authenticated 
USING (
    ativa = true 
    OR professor_id IN (SELECT id FROM professores WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('direcao', 'coordenacao'))
);

-- Gerenciamento: Apenas Admins
CREATE POLICY "Gerenciamento de turmas" 
ON public.turmas FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('direcao', 'coordenacao')));


-- 3. Garantir acesso às Atividades (necessário para o INNER JOIN no frontend)
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos podem ver atividades ativas" ON public.atividades;
CREATE POLICY "Acesso as atividades" ON public.atividades FOR SELECT TO authenticated USING (true);
