-- Sprint 1: Multi-instituição — tipo e feature flags por unidade
-- Retrocompatível: todos os valores têm DEFAULT, nada quebra nas unidades existentes.

ALTER TABLE public.unidades
  ADD COLUMN IF NOT EXISTS tipo_instituicao TEXT
    DEFAULT 'escola'
    CHECK (tipo_instituicao IN ('escola', 'academia', 'ong', 'empresa', 'custom')),
  ADD COLUMN IF NOT EXISTS feature_flags JSONB
    NOT NULL
    DEFAULT '{
      "saude": true,
      "predio": true,
      "academico": true,
      "comissoes": true,
      "calendario": true,
      "voluntarios": true,
      "indicacoes": false,
      "landing_publica": true
    }'::jsonb;

-- Índice para buscas por tipo (útil para métricas futuras por segmento)
CREATE INDEX IF NOT EXISTS idx_unidades_tipo_instituicao
  ON public.unidades (tipo_instituicao);

COMMENT ON COLUMN public.unidades.tipo_instituicao IS
  'Tipo da instituição: escola, academia, ong, empresa, custom';

COMMENT ON COLUMN public.unidades.feature_flags IS
  'Módulos ativos para esta unidade. Controlado pela Direção em Configurações > Módulos.';
