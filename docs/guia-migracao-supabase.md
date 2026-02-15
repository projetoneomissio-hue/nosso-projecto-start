# 🚀 Guia de Migração - Neo Missio para Supabase Externo

> Guia completo para migrar o projeto Neo Missio do Lovable Cloud para uma instância Supabase própria.

---

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com) (plano gratuito funciona)
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado (`npm install -g supabase`)
- [Deno](https://deno.land) instalado (para Edge Functions)
- Conta no [Stripe](https://stripe.com) (para pagamentos)
- Conta Gmail com App Password (para e-mails)

---

## Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em **New Project**
3. Escolha nome, senha do banco e região (ex: `South America (São Paulo)`)
4. Aguarde a criação (~2 minutos)
5. Anote as credenciais em **Settings → API**:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **anon/public key** (começa com `eyJ...`)
   - **service_role key** (⚠️ nunca exponha no frontend!)
   - **Project ID** (na URL: `supabase.com/dashboard/project/<PROJECT_ID>`)

---

## Passo 2: Importar Schema do Banco de Dados

1. No Supabase Dashboard, vá em **SQL Editor**
2. Abra o arquivo `docs/database-schema-export.sql` do projeto
3. Cole **todo o conteúdo** no SQL Editor
4. Clique em **Run** (pode levar alguns segundos)
5. Verifique se todas as tabelas foram criadas em **Table Editor**

### ✅ Checklist de verificação:
- [ ] 19 tabelas criadas (profiles, user_roles, alunos, atividades, turmas, matriculas, pagamentos, presencas, anamneses, observacoes, coordenador_atividades, invitations, custos_predio, funcionarios, locacoes, comunicados, comunicado_envios, mfa_recovery_codes)
- [ ] 1 view criada (alunos_secure)
- [ ] 14 funções criadas (has_role, is_responsavel_aluno, is_professor_turma, is_coordenador_atividade, is_coordenador_turma, get_aluno_responsavel_id, get_alunos_by_responsavel, is_professor_aluno, mask_cpf, get_aluno_cpf, validate_invitation_token, validate_recovery_code, handle_updated_at, handle_new_user)
- [ ] RLS habilitado em todas as tabelas
- [ ] Trigger `on_auth_user_created` ativo

---

## Passo 3: Configurar Autenticação

1. No Supabase Dashboard, vá em **Authentication → Providers**
2. **Email** já vem habilitado por padrão
3. Em **Authentication → Settings**:
   - **Site URL**: `https://seu-dominio.com` (ou URL do Lovable)
   - **Redirect URLs**: adicione `https://seu-dominio.com/*`
4. **NÃO** habilite "Enable email confirmations" se quiser auto-confirm (opcional)

### Configuração de E-mail (SMTP) - Recomendado:

Por padrão, o Supabase usa seu próprio servidor de e-mail (limitado a 3 e-mails/hora). Para produção:

1. Vá em **Settings → Auth → SMTP Settings**
2. Habilite "Custom SMTP"
3. Configure com Gmail:
   - **Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **Username**: seu email Gmail
   - **Password**: App Password do Gmail (não a senha normal!)

---

## Passo 4: Configurar Secrets (Edge Functions)

No Supabase Dashboard, vá em **Settings → Edge Functions → Secrets** e adicione:

| Secret Name | Onde Obter | Descrição |
|---|---|---|
| `STRIPE_SECRET_KEY` | [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys) | Chave secreta do Stripe (começa com `sk_`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → Endpoint → Signing Secret | Secret do webhook (começa com `whsec_`) |
| `GMAIL_EMAIL` | Sua conta Gmail | E-mail usado para enviar notificações |
| `GMAIL_APP_PASSWORD` | [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords) | Senha de app do Gmail (16 caracteres) |

> ⚠️ **SUPABASE_URL**, **SUPABASE_ANON_KEY** e **SUPABASE_SERVICE_ROLE_KEY** já são automaticamente disponíveis nas Edge Functions do Supabase. Não precisa adicioná-los manualmente.

---

## Passo 5: Deploy das Edge Functions

### 5.1 Vincular projeto

```bash
# Na raiz do projeto
supabase login
supabase link --project-ref <SEU_PROJECT_ID>
```

### 5.2 Deploy de todas as funções

```bash
supabase functions deploy check-payments
supabase functions deploy create-checkout
supabase functions deploy create-payment-link
supabase functions deploy generate-link-v2
supabase functions deploy send-comunicado
supabase functions deploy send-email
supabase functions deploy send-invitation-email
supabase functions deploy send-notifications
supabase functions deploy send-payment-reminder
supabase functions deploy stripe-webhook --no-verify-jwt
```

> ⚠️ **Importante**: O `stripe-webhook` precisa de `--no-verify-jwt` porque recebe chamadas do Stripe (sem JWT).

### 5.3 Lista de Edge Functions e suas finalidades:

| Função | JWT | Descrição |
|---|---|---|
| `check-payments` | ✅ | Verifica status de pagamentos |
| `create-checkout` | ✅ | Cria sessão Stripe Checkout |
| `create-payment-link` | ✅ | Gera link de pagamento Stripe |
| `generate-link-v2` | ✅ | Gera link de pagamento v2 |
| `send-comunicado` | ✅ | Envia comunicados por e-mail |
| `send-email` | ✅ | Serviço genérico de e-mail |
| `send-invitation-email` | ✅ | Envia convites por e-mail |
| `send-notifications` | ✅ | Sistema de notificações automáticas |
| `send-payment-reminder` | ✅ | Lembrete de pagamento |
| `stripe-webhook` | ❌ | Recebe eventos do Stripe |

---

## Passo 6: Configurar Stripe Webhook

1. No [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Clique em **Add endpoint**
3. **Endpoint URL**: `https://<SEU_PROJECT_ID>.supabase.co/functions/v1/stripe-webhook`
4. **Events to listen**:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `payment_intent.succeeded`
5. Copie o **Signing Secret** (`whsec_...`) e adicione como secret `STRIPE_WEBHOOK_SECRET`

---

## Passo 7: Atualizar Variáveis de Ambiente no Frontend

### Opção A: Conectar via Lovable

1. Em Lovable, vá em **Settings → Connectors**
2. Desabilite o Lovable Cloud
3. Conecte seu projeto Supabase externo:
   - **URL**: `https://<SEU_PROJECT_ID>.supabase.co`
   - **Anon Key**: sua anon key

### Opção B: Rodar localmente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://<SEU_PROJECT_ID>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<SUA_ANON_KEY>
VITE_SUPABASE_PROJECT_ID=<SEU_PROJECT_ID>
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

---

## Passo 8: Criar Primeiro Usuário Administrativo

Após a migração, você precisa de um usuário com role `direcao`:

1. Acesse a aplicação e faça **signup** com o e-mail do administrador
2. No Supabase Dashboard, vá em **SQL Editor** e execute:

```sql
-- Substitua pelo ID do usuário criado (encontre em Authentication → Users)
UPDATE public.user_roles 
SET role = 'direcao' 
WHERE user_id = '<USER_ID_DO_ADMIN>';
```

Ou, se preferir, insira diretamente:

```sql
-- Encontre o user_id em Authentication → Users
INSERT INTO public.user_roles (user_id, role) 
VALUES ('<USER_ID>', 'direcao')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## Passo 9: Verificação Final

### ✅ Checklist completo de migração:

- [ ] Projeto Supabase criado
- [ ] Schema SQL importado com sucesso
- [ ] Trigger `on_auth_user_created` funcionando
- [ ] Secrets configurados (Stripe, Gmail)
- [ ] Edge Functions deployadas
- [ ] Webhook do Stripe configurado e testado
- [ ] Variáveis de ambiente do frontend atualizadas
- [ ] Primeiro usuário admin criado
- [ ] Login/signup funcionando
- [ ] Cadastro de alunos funcionando
- [ ] Pagamento via Stripe funcionando
- [ ] Envio de e-mails funcionando

---

## 🔧 Troubleshooting

### Erro: "infinite recursion detected in policy"
As políticas RLS já foram corrigidas usando funções `SECURITY DEFINER` (get_alunos_by_responsavel, is_professor_aluno). Se aparecer esse erro, verifique se todas as funções helper foram criadas corretamente.

### Erro: "new row violates row-level security policy"
Verifique se o usuário está autenticado e se as policies RLS permitem a operação. Para debug, verifique os logs em **Dashboard → Logs → Postgres**.

### Edge Function retorna 500
Verifique em **Dashboard → Edge Functions → Logs** se os secrets estão configurados corretamente.

### Webhook do Stripe não funciona
1. Verifique o `STRIPE_WEBHOOK_SECRET` (deve começar com `whsec_`)
2. Teste com `stripe listen --forward-to https://<PROJECT_ID>.supabase.co/functions/v1/stripe-webhook`
3. Verifique os logs da Edge Function

### E-mails não são enviados
1. Verifique se `GMAIL_EMAIL` e `GMAIL_APP_PASSWORD` estão configurados
2. A App Password deve ter 16 caracteres (sem espaços)
3. Verifique se "Less secure app access" está habilitado ou use App Passwords

---

## 📊 Arquitetura do Sistema

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Frontend      │────▶│   Supabase       │────▶│  PostgreSQL │
│   (React/Vite)  │     │   (Auth + API)   │     │  (Database)  │
└─────────────────┘     └──────────────────┘     └─────────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              ┌──────────┐ ┌──────┐ ┌──────────┐
              │ Edge     │ │Stripe│ │ Gmail    │
              │Functions │ │ API  │ │ SMTP     │
              └──────────┘ └──────┘ └──────────┘
```

### Roles do Sistema:
- **direcao**: Acesso total (CRUD em tudo)
- **coordenacao**: Gerencia atividades/turmas vinculadas
- **professor**: Presença, observações, visualização de alunos
- **responsavel**: Cadastro de alunos, matrículas, pagamentos

---

*Documento gerado em 2026-02-15 | Neo Missio v2.0*
