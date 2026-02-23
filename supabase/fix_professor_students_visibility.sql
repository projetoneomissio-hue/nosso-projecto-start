
-- SOLUÇÃO PARA VISIBILIDADE DE ALUNOS E MATRÍCULAS PARA PROFESSORES
-- Garante que o professor possa ver quem são seus alunos e suas informações básicas/saúde.

-- 1. Matrículas: Professor deve ver quem está matriculado nas turmas dele
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Professores podem ver matrículas de suas turmas" ON public.matriculas;

CREATE POLICY "Professores veem matriculas das suas turmas"
ON public.matriculas FOR SELECT
TO authenticated
USING (
    turma_id IN (
        SELECT id FROM turmas WHERE professor_id IN (
            SELECT id FROM professores WHERE user_id = auth.uid()
        )
    )
    OR public.has_role(auth.uid(), 'direcao')
    OR public.has_role(auth.uid(), 'coordenacao')
);

-- 2. Alunos: Professor deve ver os dados dos alunos (nome, etc)
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Direção, coordenação e professores podem ver todos os alunos" ON public.alunos;

CREATE POLICY "Acesso aos alunos para equipe"
ON public.alunos FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'direcao') 
    OR public.has_role(auth.uid(), 'coordenacao') 
    OR public.has_role(auth.uid(), 'professor')
    OR auth.uid() = responsavel_id
);

-- 3. Anamneses: Professor precisa ver dados de saúde para segurança nas aulas
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Professores podem ver anamneses" ON public.anamneses;

CREATE POLICY "Professores veem anamneses dos seus alunos"
ON public.anamneses FOR SELECT
TO authenticated
USING (
    aluno_id IN (
        SELECT aluno_id FROM matriculas WHERE turma_id IN (
            SELECT id FROM turmas WHERE professor_id IN (
                SELECT id FROM professores WHERE user_id = auth.uid()
            )
        )
    )
    OR public.has_role(auth.uid(), 'direcao')
    OR public.has_role(auth.uid(), 'coordenacao')
);

-- 4. Presenças: Professor deve gerenciar as presenças
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Professores podem registrar presença em suas turmas" ON public.presencas;

CREATE POLICY "Professores gerenciam presencas"
ON public.presencas FOR ALL
TO authenticated
USING (
    matricula_id IN (
        SELECT id FROM matriculas WHERE turma_id IN (
            SELECT id FROM turmas WHERE professor_id IN (
                SELECT id FROM professores WHERE user_id = auth.uid()
            )
        )
    )
    OR public.has_role(auth.uid(), 'direcao')
    OR public.has_role(auth.uid(), 'coordenacao')
);
