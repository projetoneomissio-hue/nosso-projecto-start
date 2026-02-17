-- Adiciona coluna para controlar quando o último lembrete foi enviado
-- Isso evita spam de emails para o responsável
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS ultimo_lembrete TIMESTAMPTZ;

-- Comentário na coluna para documentação
COMMENT ON COLUMN pagamentos.ultimo_lembrete IS 'Data e hora do último envio de email de cobrança automático';
