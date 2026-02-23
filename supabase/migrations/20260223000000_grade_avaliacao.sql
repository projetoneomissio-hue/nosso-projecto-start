
-- 1. Tabela de Avaliações
CREATE TABLE IF NOT EXISTS public.avaliacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
    unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'prova', -- prova, trabalho, participacao, outro
    bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
    peso DECIMAL DEFAULT 1.0,
    data_realizacao DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Notas
CREATE TABLE IF NOT EXISTS public.notas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    avaliacao_id UUID REFERENCES public.avaliacoes(id) ON DELETE CASCADE NOT NULL,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
    valor_numerico DECIMAL CHECK (valor_numerico BETWEEN 0 AND 10),
    conceito TEXT, -- A, B, C, D ou MB, B, R, I
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(avaliacao_id, aluno_id)
);

-- 3. Habilitar RLS
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para Avaliações
CREATE POLICY "Admins podem tudo em avaliacoes" ON public.avaliacoes
    FOR ALL TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role IN ('direcao', 'coordenacao')
        )
    );

CREATE POLICY "Professores gerenciam avaliacoes de suas turmas" ON public.avaliacoes
    FOR ALL TO authenticated
    USING (
        turma_id IN (
            SELECT id FROM turmas WHERE professor_id IN (
                SELECT id FROM professores WHERE user_id = auth.uid()
            )
        )
    );

-- 5. Políticas para Notas
CREATE POLICY "Admins podem tudo em notas" ON public.notas
    FOR ALL TO authenticated
    USING (
        avaliacao_id IN (
            SELECT id FROM avaliacoes WHERE unidade_id IN (
                SELECT unidade_id FROM user_unidades WHERE user_id = auth.uid() AND role IN ('direcao', 'coordenacao')
            )
        )
    );

CREATE POLICY "Professores gerenciam notas de suas avaliacoes" ON public.notas
    FOR ALL TO authenticated
    USING (
        avaliacao_id IN (
            SELECT id FROM avaliacoes WHERE turma_id IN (
                SELECT id FROM turmas WHERE professor_id IN (
                    SELECT id FROM professores WHERE user_id = auth.uid()
                )
            )
        )
    );

-- 6. Trigger para updated_at
CREATE TRIGGER set_updated_at_avaliacoes BEFORE UPDATE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_notas BEFORE UPDATE ON public.notas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
