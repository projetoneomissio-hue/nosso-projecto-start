-- Add ultimo_aviso_data to pagamentos to track dunning notifications
ALTER TABLE pagamentos ADD COLUMN ultimo_aviso_data DATE;

-- Comment
COMMENT ON COLUMN pagamentos.ultimo_aviso_data IS 'Data do último envio de e-mail de aviso/cobrança';
