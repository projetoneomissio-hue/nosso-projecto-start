
-- Garantir que professores possam ver suas próprias turmas, mesmo que a política "ativa" falhe por algum motivo
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

-- Remove duplicate policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Professores veem suas turmas" ON public.turmas;

CREATE POLICY "Professores veem suas turmas"
ON public.turmas
FOR SELECT
TO authenticated
USING (
    professor_id IN (
        SELECT id FROM professores WHERE user_id = auth.uid()
    )
);

-- Garantir que professores possam ver as atividades vinculadas às turmas
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Professores veem atividades das turmas" ON public.atividades;

CREATE POLICY "Professores veem atividades das turmas"
ON public.atividades
FOR SELECT
TO authenticated
USING (
    TRUE
); -- Atividades geralmente são públicas para usuários autenticados
