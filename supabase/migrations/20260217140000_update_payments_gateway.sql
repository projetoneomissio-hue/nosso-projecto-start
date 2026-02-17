-- Adiciona campos para controle de Gateway de Pagamento Externo (Stripe/Asaas)
ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS gateway_id TEXT, -- ID da transação no gateway (ex: pay_123)
ADD COLUMN IF NOT EXISTS gateway_url TEXT, -- Link do boleto ou fatura
ADD COLUMN IF NOT EXISTS gateway_provider TEXT DEFAULT 'manual'; -- 'stripe', 'asaas', 'manual'

COMMENT ON COLUMN pagamentos.gateway_id IS 'Identificador único da cobrança no gateway externo';
COMMENT ON COLUMN pagamentos.gateway_url IS 'URL pública para o responsável efetuar o pagamento';
