-- ================================================================
-- FIX: Isolamento real por unidade_id em todas as RLS policies
-- ================================================================
-- Problema: policies existentes usam has_role() / user_roles (global).
-- Direção da Unidade A conseguia ver dados da Unidade B.
--
-- Fix: todas as verificações de role passam a usar user_unidades,
-- que vincula usuário + unidade + role juntos.
--
-- Super-admin = direção da Matriz (id fixo 00000000-...-0001).
-- Continua tendo acesso irrestrito para suporte e operação.
-- ================================================================

-- ── 1. Funções auxiliares ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.has_role_in_unidade(
  p_user_id    UUID,
  p_unidade_id UUID,
  p_role       TEXT
) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_unidades
    WHERE user_id    = p_user_id
      AND unidade_id = p_unidade_id
      AND role       = p_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_unidades
    WHERE user_id    = p_user_id
      AND unidade_id = '00000000-0000-0000-0000-000000000001'
      AND role       = 'direcao'
  );
$$;

-- ── 2. Garantir unidade_id em TODAS as tabelas referenciadas ─────────────────

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'alunos', 'turmas', 'matriculas', 'pagamentos',
    'professores', 'custos_predio', 'funcionarios', 'locacoes',
    'atividades', 'comunicados', 'audit_logs'
  ]
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES public.unidades(id) DEFAULT %L',
      tbl, '00000000-0000-0000-0000-000000000001'
    );
    EXECUTE format(
      'UPDATE public.%I SET unidade_id = %L WHERE unidade_id IS NULL',
      tbl, '00000000-0000-0000-0000-000000000001'
    );
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN unidade_id SET NOT NULL',
      tbl
    );
    RAISE NOTICE 'unidade_id garantida em: %', tbl;
  END LOOP;
END;
$$;

-- ── 3. ALUNOS ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Direção, coordenação e professores podem ver todos os alunos" ON public.alunos;
DROP POLICY IF EXISTS "Direção pode gerenciar alunos" ON public.alunos;
DROP POLICY IF EXISTS "Equipe da unidade pode ver alunos" ON public.alunos;
DROP POLICY IF EXISTS "Direção da unidade gerencia alunos" ON public.alunos;

CREATE POLICY "Equipe da unidade pode ver alunos"
ON public.alunos FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'coordenacao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'professor')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'secretaria')
);

CREATE POLICY "Direção da unidade gerencia alunos"
ON public.alunos FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
);

-- ── 4. TURMAS ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Todos podem ver turmas ativas" ON public.turmas;
DROP POLICY IF EXISTS "Direção e coordenação podem gerenciar turmas" ON public.turmas;
DROP POLICY IF EXISTS "Membros da unidade veem turmas" ON public.turmas;
DROP POLICY IF EXISTS "Direção e coordenação da unidade gerenciam turmas" ON public.turmas;

CREATE POLICY "Membros da unidade veem turmas"
ON public.turmas FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_unidades
    WHERE user_id    = auth.uid()
      AND unidade_id = turmas.unidade_id
  )
);

CREATE POLICY "Direção e coordenação da unidade gerenciam turmas"
ON public.turmas FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'coordenacao')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'coordenacao')
);

-- ── 5. MATRÍCULAS ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Direção e coordenação podem gerenciar matrículas" ON public.matriculas;
DROP POLICY IF EXISTS "Equipe da unidade gerencia matrículas" ON public.matriculas;

CREATE POLICY "Equipe da unidade gerencia matrículas"
ON public.matriculas FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'coordenacao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'secretaria')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'coordenacao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'secretaria')
);

-- ── 6. PAGAMENTOS ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Direção e coordenação podem gerenciar pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Direção e coordenação da unidade gerenciam pagamentos" ON public.pagamentos;

CREATE POLICY "Direção e coordenação da unidade gerenciam pagamentos"
ON public.pagamentos FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'coordenacao')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'coordenacao')
);

-- ── 7. PROFESSORES ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Direção pode gerenciar professores" ON public.professores;
DROP POLICY IF EXISTS "Professores podem atualizar seus dados" ON public.professores;
DROP POLICY IF EXISTS "Professor vê e atualiza seu próprio registro" ON public.professores;
DROP POLICY IF EXISTS "Direção da unidade gerencia professores" ON public.professores;
DROP POLICY IF EXISTS "Equipe da unidade vê professores" ON public.professores;

CREATE POLICY "Professor vê e atualiza seu próprio registro"
ON public.professores FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Direção da unidade gerencia professores"
ON public.professores FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
);

CREATE POLICY "Equipe da unidade vê professores"
ON public.professores FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'coordenacao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'secretaria')
);

-- ── 8. CUSTOS PREDIO ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Direção possui acesso total aos custos" ON public.custos_predio;
DROP POLICY IF EXISTS "Direção da unidade gerencia custos do prédio" ON public.custos_predio;

CREATE POLICY "Direção da unidade gerencia custos do prédio"
ON public.custos_predio FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
);

-- ── 9. FUNCIONARIOS ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Direção possui acesso total aos funcionários" ON public.funcionarios;
DROP POLICY IF EXISTS "Direção da unidade gerencia funcionários" ON public.funcionarios;

CREATE POLICY "Direção da unidade gerencia funcionários"
ON public.funcionarios FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
);

-- ── 10. LOCACOES ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Direção possui acesso total às locações" ON public.locacoes;
DROP POLICY IF EXISTS "Direção da unidade gerencia locações" ON public.locacoes;

CREATE POLICY "Direção da unidade gerencia locações"
ON public.locacoes FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
);

-- ── 11. OBSERVAÇÕES ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Direção e coordenação podem ver todas as observações" ON public.observacoes;
DROP POLICY IF EXISTS "Equipe da unidade vê observações" ON public.observacoes;

CREATE POLICY "Equipe da unidade vê observações"
ON public.observacoes FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.alunos a
    WHERE a.id = observacoes.aluno_id
      AND (
        public.has_role_in_unidade(auth.uid(), a.unidade_id, 'direcao')
        OR public.has_role_in_unidade(auth.uid(), a.unidade_id, 'coordenacao')
        OR public.has_role_in_unidade(auth.uid(), a.unidade_id, 'professor')
      )
  )
);

-- ── 12. PRESENÇAS ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Direção e coordenação podem ver todas as presenças" ON public.presencas;
DROP POLICY IF EXISTS "Equipe da unidade vê presenças" ON public.presencas;

CREATE POLICY "Equipe da unidade vê presenças"
ON public.presencas FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.matriculas m
    JOIN public.alunos a ON a.id = m.aluno_id
    WHERE m.id = presencas.matricula_id
      AND (
        public.has_role_in_unidade(auth.uid(), a.unidade_id, 'direcao')
        OR public.has_role_in_unidade(auth.uid(), a.unidade_id, 'coordenacao')
      )
  )
);

-- ── 13. ANAMNESES ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Direção e coordenação podem ver todas as anamneses" ON public.anamneses;
DROP POLICY IF EXISTS "Professores podem ver anamneses" ON public.anamneses;
DROP POLICY IF EXISTS "Equipe da unidade vê anamneses" ON public.anamneses;

CREATE POLICY "Equipe da unidade vê anamneses"
ON public.anamneses FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.alunos a
    WHERE a.id = anamneses.aluno_id
      AND (
        public.has_role_in_unidade(auth.uid(), a.unidade_id, 'direcao')
        OR public.has_role_in_unidade(auth.uid(), a.unidade_id, 'coordenacao')
        OR public.has_role_in_unidade(auth.uid(), a.unidade_id, 'professor')
      )
  )
);

-- ── 14. ATIVIDADES ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Direção e coordenação podem gerenciar atividades" ON public.atividades;
DROP POLICY IF EXISTS "Usuários podem ver atividades conforme seu papel" ON public.atividades;
DROP POLICY IF EXISTS "Professores veem atividades das turmas" ON public.atividades;
DROP POLICY IF EXISTS "Secretaria can view atividades" ON public.atividades;
DROP POLICY IF EXISTS "Membros da unidade veem atividades" ON public.atividades;
DROP POLICY IF EXISTS "Direção e coordenação da unidade gerenciam atividades" ON public.atividades;

CREATE POLICY "Membros da unidade veem atividades"
ON public.atividades FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_unidades
    WHERE user_id    = auth.uid()
      AND unidade_id = atividades.unidade_id
  )
);

CREATE POLICY "Direção e coordenação da unidade gerenciam atividades"
ON public.atividades FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'coordenacao')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'coordenacao')
);

-- ── 15. COMUNICADOS ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Direção e coordenação podem gerenciar comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Responsáveis podem ver comunicados destinados a eles" ON public.comunicados;
DROP POLICY IF EXISTS "Direção e coordenação da unidade gerenciam comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Responsáveis veem comunicados da sua unidade" ON public.comunicados;

CREATE POLICY "Direção e coordenação da unidade gerenciam comunicados"
ON public.comunicados FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'coordenacao')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'coordenacao')
);

CREATE POLICY "Responsáveis veem comunicados da sua unidade"
ON public.comunicados FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.alunos a
    JOIN public.matriculas m ON m.aluno_id = a.id
    WHERE a.responsavel_id  = auth.uid()
      AND a.unidade_id      = comunicados.unidade_id
  )
);

-- ── 16. INVITATIONS ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Management manage invitations" ON public.invitations;
DROP POLICY IF EXISTS "Superadmin cria convites" ON public.invitations;
DROP POLICY IF EXISTS "Equipe da unidade gerencia convites" ON public.invitations;

-- Acesso anônimo para validar token permanece (login flow)
-- "Anon validate tokens" — NÃO dropar

CREATE POLICY "Equipe da unidade gerencia convites"
ON public.invitations FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'secretaria')
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'secretaria')
);

-- ── 17. AUDIT LOGS ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Direção pode ver logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Direção da unidade vê seus logs" ON public.audit_logs;

CREATE POLICY "Direção da unidade vê seus logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role_in_unidade(auth.uid(), unidade_id, 'direcao')
);
