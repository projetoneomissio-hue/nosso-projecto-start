# Sistema de Notificações Automáticas

## Visão Geral

O sistema de notificações automáticas envia emails para responsáveis sobre:
1. **Pagamentos próximos ao vencimento** (5 dias antes)
2. **Matrículas pendentes** (aguardando aprovação há mais de 3 dias)

## Edge Functions Criadas

### 1. send-payment-reminder
- **Função**: Envio manual de lembretes de pagamento
- **Uso**: Botão de email na página de Inadimplentes
- **Requer autenticação**: Sim (JWT)
- **Parâmetros**:
  - `to`: Email do responsável
  - `responsavelNome`: Nome do responsável
  - `alunoNome`: Nome do aluno
  - `atividadeNome`: Nome da atividade
  - `turmaNome`: Nome da turma
  - `valorDevido`: Valor total devido
  - `diasAtraso`: Dias de atraso
  - `dataVencimento`: Data de vencimento original

### 2. send-notifications
- **Função**: Verificação e envio automático de notificações
- **Uso**: Pode ser executado manualmente ou via cron job
- **Requer autenticação**: Não (público)
- **Funcionalidade**:
  - Verifica pagamentos que vencem em 5 dias
  - Verifica matrículas pendentes há mais de 3 dias
  - Envia emails automáticos para os responsáveis

## Configuração de Cron Job (Opcional)

Para executar as notificações automaticamente, você pode configurar um cron job no Supabase:

### Passo 1: Habilitar Extensões

Execute no SQL Editor do Supabase:

\`\`\`sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
\`\`\`

### Passo 2: Criar Cron Job

Execute no SQL Editor:

\`\`\`sql
-- Executar diariamente às 9h
SELECT cron.schedule(
  'send-daily-notifications',
  '0 9 * * *', -- Todo dia às 9h
  $$
  SELECT
    net.http_post(
        url:='https://wanvrxtpqvxvczuzqhui.supabase.co/functions/v1/send-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhbnZyeHRwcXZ4dmN6dXpxaHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNjE1NTMsImV4cCI6MjA3ODgzNzU1M30.ohKt971mPFPrnKP06NDyERzf1TMookCCAmtAmJHCmaQ"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
\`\`\`

### Verificar Cron Jobs Ativos

\`\`\`sql
SELECT * FROM cron.job;
\`\`\`

### Remover Cron Job

\`\`\`sql
SELECT cron.unschedule('send-daily-notifications');
\`\`\`

## Testes Manuais

### Testar Envio Manual de Lembrete
1. Acesse a página de **Inadimplentes**
2. Clique no botão de email ao lado de um aluno inadimplente
3. Verifique os logs no console

### Testar Notificações Automáticas
Execute no terminal ou Postman:

\`\`\`bash
curl -X POST https://wanvrxtpqvxvczuzqhui.supabase.co/functions/v1/send-notifications \
  -H "Content-Type: application/json" \
  -d '{}'
\`\`\`

## Logs e Monitoramento

Para verificar os logs das notificações:
1. Acesse o dashboard do Lovable Cloud
2. Navegue até **Edge Functions**
3. Selecione a função desejada
4. Visualize os logs em tempo real

## Variáveis de Ambiente Necessárias

As seguintes variáveis já estão configuradas:
- `GMAIL_EMAIL`: Email do Gmail para envio
- `GMAIL_APP_PASSWORD`: Senha de aplicativo do Gmail
- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase

## Personalização

### Alterar Dias de Antecedência
Edite em `send-notifications/index.ts`:
\`\`\`typescript
// Linha 35 - Alterar de 5 para outro valor
cincoDiasDepois.setDate(cincoDiasDepois.getDate() + 5);
\`\`\`

### Alterar Template de Email
Edite o HTML em:
- `send-payment-reminder/index.ts` (linha 44-92)
- `send-notifications/index.ts` (linha 86-118)

## Notas Importantes

⚠️ **Gmail SMTP**: O sistema está preparado para usar Gmail SMTP, mas requer configuração OAuth2 completa para produção.

⚠️ **Testes**: Sempre teste em ambiente de desenvolvimento antes de ativar o cron job em produção.

⚠️ **Limites**: Verifique os limites de envio de email do Gmail (normalmente 500 emails/dia para contas gratuitas).
