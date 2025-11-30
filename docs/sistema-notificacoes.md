# Sistema de Notificações - Neo Missio

## 📧 Visão Geral

O Neo Missio possui um sistema automatizado de notificações que envia lembretes por **email** e está preparado para integração futura com **WhatsApp**.

---

## 🎯 Tipos de Notificações

### 1. **Lembretes de Pagamento** (Antes do Vencimento)
- **Quando**: 5 dias antes da data de vencimento
- **Para quem**: Responsáveis com pagamentos pendentes
- **Conteúdo**:
  - Nome do aluno
  - Atividade e turma
  - Valor da mensalidade
  - Data de vencimento
  - Dias restantes até o vencimento

### 2. **Alertas de Pagamento Atrasado**
- **Quando**: Pagamentos já vencidos
- **Para quem**: Responsáveis com inadimplência
- **Conteúdo**:
  - Informações do pagamento
  - Dias de atraso
  - Valor total devido
  - Alerta sobre suspensão de atividades

### 3. **Notificações de Matrículas Pendentes**
- **Quando**: Matrículas aguardando aprovação há mais de 3 dias
- **Para quem**: Coordenação e direção
- **Conteúdo**:
  - Nome do aluno e responsável
  - Atividade solicitada
  - Turma escolhida
  - Dias aguardando aprovação

---

## 🔧 Como Usar o Sistema de Notificações

### **Acesso** (Coordenação e Direção)
- Menu: **Notificações** ou **Coordenação > Notificações**
- Rota: `/coordenacao/notificacoes`

### **Painel de Controle**
O painel mostra:
- ✅ **Pagamentos Próximos**: Quantidade de pagamentos que vencem em até 5 dias
- ⚠️ **Pagamentos Atrasados**: Quantidade de inadimplências ativas
- 📋 **Matrículas Pendentes**: Quantidade aguardando aprovação há mais de 3 dias

### **Envio Manual de Notificações**
1. Acesse o painel de notificações
2. Clique em **"Enviar Notificações Agora"**
3. O sistema processará automaticamente:
   - Identifica todos os pagamentos próximos ao vencimento
   - Identifica todas as matrículas pendentes
   - Envia emails formatados para os responsáveis
   - Retorna estatísticas do envio

---

## 📨 Templates de Email

### **Template: Lembrete de Pagamento**
```
Assunto: Lembrete de Pagamento - [Nome do Aluno]

Olá, [Nome do Responsável],

Este é um lembrete amigável sobre o pagamento da mensalidade 
do(a) aluno(a) [Nome do Aluno].

⚠️ Vencimento em X dia(s)

Detalhes do Pagamento:
• Aluno: [Nome]
• Atividade: [Atividade]
• Turma: [Turma]
• Data de Vencimento: [Data]
• Valor: R$ [Valor]

Para evitar atrasos, solicitamos que realize o pagamento 
até a data de vencimento.

Atenciosamente,
Equipe Neo Missio
```

### **Template: Pagamento Atrasado**
```
Assunto: Pagamento em Atraso - [Nome do Aluno]

Olá, [Nome do Responsável],

Identificamos que há pagamentos em atraso referentes à 
matrícula do(a) aluno(a) [Nome do Aluno].

⚠️ Atenção: Pagamento com X dias de atraso

Detalhes do Pagamento:
• Aluno: [Nome]
• Atividade: [Atividade]
• Turma: [Turma]
• Data de Vencimento: [Data]
• Valor Devido: R$ [Valor]

Solicitamos que regularize a situação o mais breve possível 
para garantir a continuidade das atividades do aluno.

Atenciosamente,
Equipe Neo Missio
```

---

## 🔐 Segurança e Permissões

### **Quem Pode Enviar Notificações?**
- ✅ Direção (todos os tipos)
- ✅ Coordenação (todos os tipos)
- ❌ Professores (não tem acesso)
- ❌ Responsáveis (não tem acesso)

### **Autenticação**
- Todas as requisições são autenticadas via JWT
- Edge functions verificam role do usuário antes de processar
- Logs detalhados de todas as operações

---

## 🚀 Edge Functions Implementadas

### **1. `send-notifications`**
- **Rota**: `https://[project-id].supabase.co/functions/v1/send-notifications`
- **Autenticação**: JWT obrigatório
- **Permissões**: Direção ou Coordenação
- **Funcionalidade**:
  - Busca pagamentos próximos ao vencimento (5 dias)
  - Busca matrículas pendentes (> 3 dias)
  - Prepara e envia emails formatados
  - Retorna estatísticas do processamento

### **2. `send-payment-reminder`**
- **Rota**: `https://[project-id].supabase.co/functions/v1/send-payment-reminder`
- **Autenticação**: JWT obrigatório
- **Permissões**: Direção ou Coordenação
- **Parâmetros**:
  ```json
  {
    "to": "email@responsavel.com",
    "responsavelNome": "Nome do Responsável",
    "alunoNome": "Nome do Aluno",
    "atividadeNome": "Nome da Atividade",
    "turmaNome": "Nome da Turma",
    "valorDevido": 100.00,
    "diasAtraso": 5,
    "dataVencimento": "31/12/2025"
  }
  ```

### **3. `send-invitation-email`**
- **Rota**: `https://[project-id].supabase.co/functions/v1/send-invitation-email`
- **Autenticação**: JWT obrigatório
- **Permissões**: Apenas Direção
- **Funcionalidade**: Envia convites de cadastro para novos usuários admin

---

## 🔄 Automação com Cron Jobs (Próxima Implementação)

### **Configuração Recomendada**
```sql
-- Executar notificações diariamente às 9h da manhã
select cron.schedule(
  'daily-notifications',
  '0 9 * * *',  -- Todos os dias às 9h
  $$
  select
    net.http_post(
        url:='https://[project-id].supabase.co/functions/v1/send-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
```

### **Como Configurar**
1. Acesse o painel Supabase do projeto
2. Vá em Database > Extensions
3. Ative `pg_cron` e `pg_net`
4. Execute o SQL acima no SQL Editor
5. Ajuste horário conforme necessário

---

## 📱 Integração WhatsApp (Planejamento Futuro)

### **Opções de Implementação**

#### **Opção 1: WhatsApp Business API** (Recomendado)
- Requer conta WhatsApp Business verificada
- Custo: Variável por mensagem
- Vantagens:
  - Oficial e confiável
  - Suporte a mensagens em massa
  - Templates pré-aprovados
  - Botões interativos
  - Status de entrega

#### **Opção 2: Twilio API**
- Integração via Twilio WhatsApp Sandbox
- Custo: ~$0.005 por mensagem
- Mais fácil de implementar
- Ideal para testes

#### **Opção 3: Evolution API** (Open Source)
- Gratuito (self-hosted)
- Usa WhatsApp Web
- Risco de bloqueio pelo WhatsApp
- Não recomendado para produção

### **Template de Mensagem WhatsApp**
```
🔔 *Neo Missio - Lembrete de Pagamento*

Olá [Nome],

Lembramos que o pagamento da mensalidade de *[Aluno]* vence em *X dias*.

📋 *Detalhes:*
• Atividade: [Atividade]
• Valor: R$ [Valor]
• Vencimento: [Data]

Para mais informações, responda esta mensagem.

_Mensagem automática - Neo Missio_
```

---

## 📊 Logs e Monitoramento

### **Visualizar Logs de Edge Functions**
```bash
# Via Supabase CLI
supabase functions logs send-notifications
supabase functions logs send-payment-reminder
```

### **O que é Registrado**
- ✅ Timestamp de cada execução
- ✅ Quantidade de notificações enviadas
- ✅ Emails dos destinatários
- ✅ Erros e exceções
- ✅ Tempo de processamento

---

## 🎓 Melhores Práticas

### **Para Coordenação**
1. Execute notificações manualmente uma vez por semana
2. Monitore os logs de envio
3. Verifique taxa de abertura dos emails
4. Acompanhe redução de inadimplência

### **Para Direção**
1. Configure automação via cron jobs
2. Defina horários estratégicos (manhã)
3. Monitore custos de envio
4. Avalie integração com WhatsApp

### **Para Desenvolvimento**
1. Teste edge functions localmente primeiro
2. Use variáveis de ambiente para credenciais
3. Implemente rate limiting se necessário
4. Mantenha logs detalhados

---

## 🔍 Troubleshooting

### **Emails não estão sendo enviados**
1. Verifique as credenciais Gmail:
   - `GMAIL_EMAIL` está correto?
   - `GMAIL_APP_PASSWORD` está válido?
2. Confirme que o usuário tem permissão (Direção/Coordenação)
3. Verifique logs da edge function
4. Teste manualmente no painel de notificações

### **Notificações duplicadas**
1. Evite executar cron jobs com muita frequência
2. Implemente controle de envios duplicados
3. Use timestamp de último envio

### **Erro de autenticação**
1. Confirme que JWT está sendo enviado
2. Verifique se `verify_jwt = true` no `config.toml`
3. Token pode estar expirado - faça novo login

---

## 📞 Suporte

Para dúvidas sobre configuração do sistema de notificações:
- **WhatsApp**: (41) 98440-6992
- **Documentação**: `/docs/sistema-notificacoes.md`
- **Logs**: Supabase Dashboard > Edge Functions
