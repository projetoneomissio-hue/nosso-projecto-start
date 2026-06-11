-- ================================================================
-- Custom Domain por Unidade (white-label)
-- ================================================================
-- Permite que cada cliente aponte seu próprio domínio para o sistema.
-- Ex: sistema.escolafeliz.com.br → Zafen, mas renderiza a Escola Feliz.
--
-- Fluxo:
--   1. Cliente configura CNAME no DNS dele apontando para Vercel
--   2. Admin registra o domínio em admin/Organizacoes
--   3. App lê window.location.hostname e resolve o tenant
-- ================================================================

ALTER TABLE public.unidades
  ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Neo Missio já usa sistema.neomissio.com.br — registrar agora.
-- (Apenas atualiza se a unidade Matriz for de fato a Neo Missio;
--  em ambientes de dev/test este UPDATE não causa dano.)
UPDATE public.unidades
  SET custom_domain = 'sistema.neomissio.com.br'
  WHERE id = '00000000-0000-0000-0000-000000000001'
    AND custom_domain IS NULL;

-- Index para lookup rápido por hostname (chamado a cada request público)
CREATE UNIQUE INDEX IF NOT EXISTS unidades_custom_domain_idx
  ON public.unidades (custom_domain)
  WHERE custom_domain IS NOT NULL;

-- RLS: unidade pública por domínio (leitura anônima para resolver tenant)
-- Necessário para que o app resolva o tenant ANTES do login.
DROP POLICY IF EXISTS "Público resolve unidade por domínio" ON public.unidades;

CREATE POLICY "Público resolve unidade por domínio"
ON public.unidades FOR SELECT
TO anon, authenticated
USING (
  custom_domain IS NOT NULL
  OR id IN (
    SELECT unidade_id FROM public.user_unidades
    WHERE user_id = auth.uid()
  )
);
