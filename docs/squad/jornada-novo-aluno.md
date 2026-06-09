# Jornada do Novo Aluno — Análise de Squad

> Data: 2026-06-08 | Sistema: NeoMissio / Zafen
> Baseado em leitura real do código. Não é especulação.

---

## Mapa Geral da Jornada

```
[DESCONHECIDO]
     │
     ▼
 1. LANDING (público)
     │  /matricula/:slug
     ▼
 2. SOLICITAÇÃO (anônimo)
     │  tabela: solicitacoes_matricula (status: interessado → pendente)
     ▼
 3. GESTÃO DE INTERESSADOS (direção/coordenação)
     │  /direcao/interessados
     ▼
 4. CONVERSÃO → ALUNO + MATRÍCULA + CONVITE
     │  tabelas: alunos, matriculas, invitations
     ▼
 5. RESPONSÁVEL RESGATA CONVITE (público)
     │  /resgatar-convite
     ▼
 6. RESPONSÁVEL LOGA + COMPLETA CADASTRO DO ALUNO
     │  /responsavel/cadastrar-aluno
     ▼
 7. MATRÍCULA ATIVA + PAGAMENTO GERADO
     │  tabelas: matriculas (status: ativa), pagamentos
     ▼
 8. RESPONSÁVEL PAGA (PIX/Cartão/Manual)
     │  /responsavel/pagamentos
     ▼
[ALUNO ATIVO NO SISTEMA]
```

---

## Etapa 1 — Landing / Captação (Público, sem login)

**Quem acessa:** qualquer visitante
**Rotas:** `/` → `/matricula/:slug`
**Arquivos:** `src/pages/Index.tsx`, `src/pages/public/MatriculaOnline.tsx`

O visitante chega na landing pública (`/`), vê as atividades disponíveis e clica em "Quero me Matricular".
É redirecionado para `/matricula/:slug` onde o slug identifica a unidade.

A URL pode vir com parâmetro `?atividade=Nome` para pré-selecionar a atividade.

**Feature flag relevante:** `landing_publica` — se desativada, esse canal não existe.

**Gap identificado:** A tabela `landing_atividades` (para o editor de atividades da landing) é opcional. Se não existir no banco, o sistema usa dados estáticos de `src/data/landing-data.ts`. A direção pode editar em `/direcao/landing` (LandingEditor), mas precisa que a tabela exista.

---

## Etapa 2 — Solicitação / Pré-Cadastro Online (Anônimo)

**Quem acessa:** visitante sem conta
**Rota:** `/matricula/:slug`
**Arquivo:** `src/pages/public/MatriculaOnline.tsx`
**Serviço:** `src/services/solicitacoes.service.ts`
**Tabela:** `solicitacoes_matricula`

### Passo 1 (captura inicial)
O visitante preenche dados mínimos:
- Nome completo, sobrenome, WhatsApp, data de nascimento

O sistema faz `upsert` na `solicitacoes_matricula` com `status: "interessado"`.
O lead já aparece no painel de Interessados da direção mesmo sem completar o formulário.

### Passo 2 (ficha completa)
O visitante preenche a ficha completa:
- Nome do responsável, email, CPF do responsável
- Escola, série/ano, necessidades especiais
- Como conheceu, autoriza imagem
- Atividade desejada

O sistema faz `upsert` com `status: "pendente"`.

### Estrutura da tabela `solicitacoes_matricula`

| Coluna | Tipo | Quando chega |
|--------|------|--------------|
| `nome_completo` | TEXT | Passo 1 |
| `sobrenome` | TEXT | Passo 1 |
| `whatsapp` | TEXT | Passo 1 |
| `data_nascimento` | DATE | Passo 1 |
| `atividade_desejada` | TEXT | Passo 1 |
| `nome_responsavel` | TEXT | Passo 2 |
| `email_responsavel` | TEXT | Passo 2 |
| `cpf_responsavel` | TEXT | Passo 2 |
| `escola` | TEXT | Passo 2 |
| `serie_ano` | TEXT | Passo 2 |
| `necessidades_especiais` | TEXT | Passo 2 |
| `como_conheceu` | TEXT | Passo 2 |
| `autoriza_imagem` | BOOLEAN | Passo 2 |
| `status` | ENUM | `interessado` → `pendente` |
| `unidade_id` | UUID | automático pelo slug |

**RLS:** anônimos podem inserir; coordenação/direção podem ler e atualizar dentro da sua unidade.

**⚠️ Gap:** O campo `email_responsavel` é capturado no formulário (linha 337 de MatriculaOnline.tsx) mas pode não existir na migration da tabela. Verificar se a coluna existe antes de ir para produção com esse fluxo.

---

## Etapa 3 — Gestão de Interessados (Direção / Coordenação)

**Quem acessa:** `direcao`, `coordenacao`
**Rota:** `/direcao/interessados`
**Arquivo:** `src/pages/direcao/Interessados.tsx`

A direção vê uma tabela com todos os leads da unidade. Para cada lead pode:

| Ação | O que faz |
|------|-----------|
| Atualizar status | Muda `interessado` → `pendente` → `aprovada` / `rejeitada` |
| Completar ficha | Abre dialog para adicionar escola/série/CPF quando o lead só fez o Passo 1 |
| **Converter** | Transforma o lead em aluno real (veja Etapa 4) |
| Deletar | Remove a solicitação |

### Alternativa: Pré-Cadastro Manual
A direção/secretaria pode iniciar o processo sem formulário público, acessando `/direcao/pre-cadastro` (`src/pages/shared/PreCadastro.tsx`). Preenche dados do responsável, seleciona ou cria alunos, e o sistema gera o convite direto.

---

## Etapa 4 — Conversão do Lead em Aluno + Matrícula + Convite

**Arquivo:** `src/pages/direcao/Interessados.tsx` — `convertMutation`
**Tabelas afetadas:** `alunos`, `matriculas`, `pagamentos`, `invitations`

Quando a direção clica em "Converter" e confirma o dialog, o sistema executa:

```
1. Verifica se responsável já tem conta (profiles por CPF)
2. Se NÃO tem conta → cria invitation com token (7 dias)
3. INSERT em alunos (com o responsável vinculado)
4. INSERT em matriculas (status: 'pendente')
5. Se é primeira matrícula → INSERT em pagamentos (taxa R$ 25, vencimento +3 dias)
6. Gera link de checkout InfinitePay (opcional)
7. Envia e-mail de convite ao responsável
```

**Invitation criada:**
```json
{
  "email": "responsavel@email.com",
  "role": "responsavel",
  "token": "uuid-gerado",
  "expires_at": "agora + 7 dias",
  "metadata": {
    "responsavel_nome": "...",
    "responsavel_cpf": "...",
    "existing_student_ids": ["uuid-aluno"]
  }
}
```

**⚠️ Gap:** A matrícula fica com `status: 'pendente'`. Não existe fluxo explícito de **aprovação de matrícula** pela direção. A matrícula só muda de status se a direção editar manualmente via SQL ou se existir uma tela que não foi mapeada.

---

## Etapa 5 — Responsável Resgata o Convite (Público)

**Rota:** `/resgatar-convite?token=XXX&email=yyy`
**Arquivo:** `src/pages/public/ResgatarConvite.tsx`
**Edge Function:** `supabase/functions/redeem-invitation/index.ts`

O responsável recebe o e-mail com o link e acessa a página de resgate.

### Fluxo para usuário NOVO

```
1. handleVerify() → invoca Edge Function "redeem-invitation"
   - Valida token + email + expiração
   - Retorna: { status: "new_user", role: "responsavel", token, email, studentNames }

2. handleSignup() → chama supabase.auth.signUp()
   - Envia invite_token no raw_user_meta_data

3. Trigger handle_new_user() dispara (CORRIGIDO na migration 000003):
   - Cria profile
   - Lê invite_token → busca role na tabela invitations
   - Insere role CORRETO em user_roles
   - Insere em user_unidades (vincula à Matriz)
   - Linka alunos do metadata ao novo responsável
   - Marca invitation como usada
```

### Fluxo para usuário JÁ EXISTENTE

```
1. handleVerify() → Edge Function detecta email já em auth.users
2. Gera link de recovery (senha)
3. Envia e-mail: "Sua conta já existe, defina sua senha"
4. Linka alunos ao usuário existente
5. Marca invitation como usada
```

---

## Etapa 6 — Responsável Completa Cadastro do Aluno

**Quem acessa:** `responsavel` logado
**Rota:** `/responsavel/cadastrar-aluno`
**Arquivo:** `src/pages/responsavel/CadastrarAluno.tsx`

O responsável preenche a ficha completa do aluno em 3 passos:

### Passo 1 — Dados Básicos
Nome, data nascimento, CPF, RG, telefone, endereço, escola, série

### Passo 2 — Saúde
PNE (sim/não), descrição + CID, laudo (upload PDF), doenças crônicas, alergias, medicamentos, tipo sanguíneo, contato de emergência

### Passo 3 — Autorizações + Foto
Autorização de imagem, upload da foto

**Tabelas afetadas:**
- `alunos` (INSERT) — dados básicos
- `anamneses` (INSERT) — dados de saúde
- Supabase Storage: buckets `student-photos` e `medical-reports`

**Feature flag relevante:** `saude` — se desativada, a aba Anamnese some da sidebar do responsável. O Passo 2 da ficha provavelmente ainda aparece (o formulário é independente da sidebar).

---

## Etapa 7 — Matrícula em Atividade (Responsável)

**Rota:** `/responsavel/nova-matricula`
**Arquivo:** `src/pages/responsavel/NovaMatricula.tsx`

O responsável seleciona:
1. Qual aluno (dentre os seus dependentes)
2. Qual atividade (lista de atividades ativas)
3. Qual turma/horário

O sistema verifica capacidade da turma (trigger no banco) e cria a matrícula com `status: 'pendente'`.

**E-mails enviados automaticamente:**
- Confirmação para o responsável
- Notificação para `diretoria@neomissio.com.br`

**Toast exibido:** "Matrícula solicitada! Aguarde aprovação da direção."

**⚠️ Gap crítico:** Existe um toast dizendo "aguarde aprovação", mas não existe tela de aprovação de matrícula! A direção não tem uma rota clara para aprovar `/pendente` → `/ativa`. Isso provavelmente é feito manualmente via `/direcao/matriculas`.

---

## Etapa 8 — Pagamento

**Rota responsável:** `/responsavel/pagamentos`
**Arquivo:** `src/pages/responsavel/Pagamentos.tsx`

O responsável vê seus pagamentos pendentes e tem duas opções:

### Opção A — Pagar Online
- Clica "Pagar Online"
- Sistema invoca Edge Function `create-infinitepay-link`
- Abre gateway InfinitePay (PIX ou cartão) em nova aba
- Após pagamento, webhook `infinitepay-webhook` atualiza `pagamentos.status` → `'pago'`
- Responsável é redirecionado para `/responsavel/pagamento-sucesso`

### Opção B — Registrar Pagamento Manual
- Acessa `/responsavel/registrar-pagamento`
- Seleciona pagamento e informa forma de pagamento
- Status muda para `'aguardando_confirmacao'`
- Secretaria/Direção confirma manualmente em `/direcao/cobrancas`

### Como os pagamentos são gerados

| Origem | Quando | Valor | Referência |
|--------|--------|-------|------------|
| Conversão de lead | Automaticamente | R$ 25 | `TAXA-MATRICULA` |
| Pagamentos mensais | Cron mensal | `atividades.valor_mensal` | Mês/Ano |

---

## Etapa 9 — Aluno Ativo no Sistema

Com matrícula ativa e pagamento em dia, o aluno aparece para:

- **Professor:** nas suas turmas → lista de chamada → grade de notas
- **Coordenador:** no dashboard de turmas
- **Direção:** em Alunos, Matrículas, Cobranças, Relatórios

---

## Caminhos Alternativos

### Caminho B — Pré-Cadastro Manual (sem formulário público)
```
Direção/Secretaria acessa /direcao/pre-cadastro
  → Preenche dados do responsável + seleciona alunos
  → Sistema cria invitation
  → Responsável recebe e-mail → resgata convite (Etapa 5)
  → Responsável completa cadastro do aluno (Etapa 6)
  → Responsável faz matrícula (Etapa 7)
```

### Caminho C — Auto-Matrícula (Aluno = Responsável)
```
PreCadastro.tsx tem checkbox "O responsável é o próprio aluno"
  → Metadata da invitation inclui flag
  → ⚠️ PARCIALMENTE IMPLEMENTADO: ResgatarConvite não processa essa flag
```

---

## Gaps e Problemas Identificados

| # | Problema | Impacto | Arquivo | Solução Sugerida |
|---|----------|---------|---------|------------------|
| 1 | `landing_atividades` não existe no banco por padrão | Editor de landing não persiste | `src/pages/direcao/LandingEditor.tsx` | Criar migration para a tabela |
| 2 | Não há tela de **aprovação de matrícula** | Matrículas ficam presas em `pendente` | `src/pages/direcao/` | Criar `/direcao/matriculas` com ação de aprovar/rejeitar |
| 3 | Auto-matrícula (aluno = responsável) parcialmente implementada | Fluxo quebrado para academias/personal | `src/pages/public/ResgatarConvite.tsx` | Processar a flag `is_self_enrollment` do metadata |
| 4 | E-mail de notificação fixo (`diretoria@neomissio.com.br`) | Multi-tenant não funciona | `src/pages/responsavel/NovaMatricula.tsx` | Buscar e-mail da direção pela unidade |
| 5 | Status `interessado` vs `pendente` semanticamente parecidos | Confusão de gestão | UI Interessados.tsx | Renomear: `lead_inicial` / `ficha_completa` |

---

## Tabelas do Banco Envolvidas (Ordem de Criação)

```
solicitacoes_matricula   ← topo do funil (anônimo)
      ↓
invitations              ← convite gerado
      ↓
auth.users + profiles    ← conta criada
      ↓
user_roles + user_unidades ← permissões
      ↓
alunos                   ← cadastro completo
      ↓
anamneses                ← dados de saúde
      ↓
matriculas               ← inscrição na atividade
      ↓
pagamentos               ← cobrança gerada
```

---

## Conclusão para o Squad

O sistema tem a jornada **funcionalmente completa**, mas com **dois gaps críticos** que precisam ser priorizados:

1. **Aprovação de Matrícula** — a direção não tem tela clara para aprovar a matrícula (`pendente → ativa`). O usuário faz a solicitação mas fica esperando sem feedback de quando será ativada.

2. **Auto-Matrícula** — academias, personal trainers e qualquer negócio onde o cliente é o próprio aluno (não tem responsável diferente) dependem desse fluxo, que está incompleto.

O resto da jornada é funcional e bem estruturado.
