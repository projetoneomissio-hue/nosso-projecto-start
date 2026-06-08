# Análise de Código: Realidade vs. Proposta Multi-Instituição

> **Sessão de Auditoria Técnica C-Level** — 08 de Junho de 2026
> **Objetivo:** Comparar o que o documento `multi-instituicao-feature-toggles.md` propõe com o que **de fato existe hoje no código-fonte** — linha a linha, arquivo a arquivo.
> **Resultado esperado:** Gap analysis concreto com prioridade de execução e risco real de cada item.

---

## 👔 Vision Chief — Diagnóstico Executivo

Antes de entrar no código, preciso deixar claro o que estamos medindo. O documento anterior foi estratégico — propôs uma arquitetura. Esta sessão é operacional: o que está **bloqueando** a estratégia hoje, no código que já está em produção?

A pergunta central é simples: **se tentarmos vender o sistema amanhã para uma academia esportiva, o que quebraria?**

A resposta, após análise da squad, é: muito mais do que esperávamos. O sistema tem uma ossatura multi-tenant excelente (RLS, `unidade_id`, roles bem definidos), mas o vocabulário, a navegação e os módulos estão todos hardcoded para o DNA do Neo Missio.

Vou passar a palavra para o CTO e CIO para a análise técnica detalhada. Em seguida, o COO mapeia os processos de onboarding. O CMO fecha com o posicionamento comercial.

---

## 🔧 CTO Architect — Auditoria Técnica Linha a Linha

### 1. A tabela `unidades` não tem os campos propostos

**Arquivo analisado:** `supabase/migrations/20260216230000_multitenant_init.sql`

```sql
-- O que existe hoje:
create table if not exists unidades (
  id uuid,
  nome text not null,
  cnpj text,
  logo_url text,
  slug text unique,
  created_at timestamp with time zone
);
```

**O que foi proposto no documento:**
```sql
-- O que PRECISA existir:
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS feature_flags JSONB;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS tipo_instituicao TEXT; -- escola, academia, ong, empresa
```

**Status:** ❌ Nenhum dos dois campos existe. A fundação da proposta de feature toggles ainda não está no banco de dados.

**Severidade:** CRÍTICA — sem isso, nada do restante da proposta pode ser implementado.

---

### 2. `UnidadeContext.tsx` — Interface incompleta e vocabulário hardcoded

**Arquivo:** `src/contexts/UnidadeContext.tsx`

**Linha 7-19 — Interface `Unidade` desatualizada:**
```typescript
export interface Unidade {
    id: string;
    nome: string;
    slug: string;
    logo_url?: string;
    cnpj?: string;
    // ... campos cosméticos
    // ❌ AUSENTE: tipo_instituicao?: string;
    // ❌ AUSENTE: feature_flags?: FeatureFlags;
}
```

**Linha 53-70 — Query SQL que não buscará os novos campos:**
```typescript
const { data, error } = await supabase
    .from("user_unidades")
    .select(`
        unidade_id,
        unidade:unidades (
          id, nome, slug, logo_url, cnpj, endereco, bairro,
          whatsapp, instagram_url, cor_primaria, email_contato
          // ❌ tipo_instituicao e feature_flags não estão aqui
        )
    `)
```

**Linha 99 — Vocabulário hardcoded para escola:**
```typescript
toast({
    description: "Não foi possível carregar as escolas vinculadas.", // ❌ "escolas" hardcoded
});
```

**Impacto:** Uma ONG ou academia veria "escolas vinculadas" em mensagens de erro. Pequeno detalhe, grande problema de credibilidade no produto.

---

### 3. `DashboardLayout.tsx` — O maior arquivo de risco

**Arquivo:** `src/components/DashboardLayout.tsx`

Esta é a peça mais crítica. A função `getNavigationByRole()` (linha 63) define **todos os itens do menu** de forma 100% estática, sem nenhum feature toggle. Veja o que está hardcoded:

**Linha 74-75 — Grupo "Acadêmico" para direção:**
```typescript
{
    group: "Acadêmico",   // ❌ Vocabulário escolar hardcoded
    items: [
        { name: "Atividades", ... },
        { name: "Turmas", ... },
        { name: "Matrículas", ... },
        { name: "Interessados", ... },
    ]
},
```
Uma academia ou empresa veria o grupo chamado "Acadêmico" — vocabulário que não pertence a elas.

**Linha 96-99 — "Prédio" sempre visível para Direção:**
```typescript
{ name: "Prédio", href: "/predio", icon: Building2 },  // ❌ Sem feature check
```
Uma empresa de cursos online não tem prédio. Esse item nunca deveria aparecer para elas.

**Linha 133-134 — "Voluntários" sempre visível para Coordenação:**
```typescript
{ name: "Voluntários", href: "/coordenacao/voluntarios", icon: UserCheck }, // ❌ Sem feature check
```
Academias e empresas não têm voluntários. Esse conceito é específico de ONGs.

**Linha 160-163 — Professor: "Grade de Notas" e "Chamada" sempre visíveis:**
```typescript
{ name: "Grade de Notas", href: "/professor/turmas", ...},    // ❌ Conceito escolar
{ name: "Chamada / Frequência", href: "/professor/turmas", ...}, // ❌ Conceito escolar
```
Um instrutor de academia ou monitor de curso livre não usa "Bimestre" e "Grade de Notas".

**Linha 164 — "Comissões" sempre visível para Professor:**
```typescript
{ name: "Comissões", href: "/professor/comissoes", ... }, // ❌ Sem feature check
```
ONGs com voluntários não pagam comissões. Esse item não deveria aparecer lá.

**Linha 191-194 — "Anamnese" sempre visível para Responsável:**
```typescript
{ name: "Anamnese", href: "/responsavel/anamnese", ...}, // ❌ Sem feature check
```
Para uma empresa de cursos profissionalizantes, anamnese não faz sentido algum.

**Linha 288 — Fallback de nome hardcoded para produto:**
```typescript
const unitName = currentUnidade?.nome || "Zafen";  // ⚠️ Fallback para nome de produto
```
Aceitável como fallback, mas revela que o sistema tem identidade dupla (Zafen/Neo Missio).

**Descoberta crítica — Calendário Escolar está nas rotas mas NÃO está na sidebar:**
Verificando `src/App.tsx` linha 121:
```typescript
<Route path="/calendario" element={<ProtectedRoute><CalendarioEscolar /></ProtectedRoute>} />
```
A rota existe, mas nenhuma entrada `getNavigationByRole()` aponta para `/calendario`. O CalendarioEscolar é **inacessível via navegação** para qualquer role. Isso é um bug de produto ativo.

---

### 4. `src/pages/Financeiro.tsx` — Vocabulário de escola hardcoded

**Arquivo:** `src/pages/Financeiro.tsx`, linha 159:
```typescript
<p className="text-muted-foreground mt-1 text-sm sm:text-base">
    Visão geral da saúde financeira da escola  // ❌ "escola" hardcoded
</p>
```
Uma academia lendo "escola" aqui vai sentir que o sistema não é para ela.

---

### 5. `ProtectedRoute.tsx` — Sem suporte a feature flags

**Arquivo:** `src/components/ProtectedRoute.tsx`, linha 48-51:
```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  // ❌ AUSENTE: allowedFeature?: keyof FeatureFlags;
}
```

Hoje, qualquer usuário com a role certa pode acessar `/predio`, `/professor/avaliacoes` etc. mesmo que o módulo devesse estar desativado para aquela instituição. A proteção existe apenas por role, não por feature.

---

### 6. Banco de Dados — Campos com DNA Escolar sem abstração

**Tabela `avaliacoes`** — `supabase/migrations/20260223000000_grade_avaliacao.sql`:
```sql
bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
tipo TEXT DEFAULT 'prova', -- prova, trabalho, participacao
```
O conceito de "bimestre" (1 a 4) é exclusivamente escolar. Uma academia que precisasse de avaliações usaria "trimestre", "módulo" ou "etapa". O `CHECK BETWEEN 1 AND 4` impede qualquer outro formato.

**Tabela `professores`** — `supabase/migrations/20260217020000_voluntarios.sql`:
```sql
alter table professores add column if not exists is_volunteer boolean default false;
```
A distinção voluntário/contratado existe na tabela, mas a UI não usa feature flag para esconder voluntários quando o módulo está desativado.

**Tabela `alunos`** — campos de saúde e PNE:
- Campos `alergias`, `medicamentos`, `observacoes` adicionados em `20260216000000_add_aluno_health_fields.sql`
- Campos `pne_cid`, `pne_laudo` adicionados em `20260606000000_add_pne_fields_to_anamneses.sql`
- Nenhum desses campos tem verificação de feature flag antes de ser exibido ou editado

---

### 7. Resumo Técnico — Matriz de Gap

| Componente | Proposto | Existe? | Risco |
|---|---|---|---|
| `unidades.tipo_instituicao` | ✅ Necessário | ❌ Não existe | CRÍTICO |
| `unidades.feature_flags` JSONB | ✅ Necessário | ❌ Não existe | CRÍTICO |
| `FeatureContext` + `useFeature()` | ✅ Necessário | ❌ Não existe | CRÍTICO |
| Sidebar condicional por feature | ✅ Necessário | ❌ Hardcoded | CRÍTICO |
| `ProtectedRoute allowedFeature` | ✅ Necessário | ❌ Não existe | ALTO |
| Vocabulário dinâmico | ✅ Desejável | ❌ Hardcoded | MÉDIO |
| Aba "Módulos" em Configurações | ✅ Desejável | ❌ Não existe | MÉDIO |
| CalendarioEscolar na sidebar | ✅ Bug ativo | ❌ Ausente | MÉDIO (bug) |
| RLS verificando feature_flags | ✅ Segurança | ❌ Não existe | BAIXO (fase 2) |

---

## ⚙️ COO Orchestrator — Mapeamento de Processos de Onboarding

### O processo atual de criar uma nova instituição é assim:

```
1. Admin cria unidade manualmente no Supabase (sem UI própria)
2. Admin convida o usuário da Direção por email
3. Usuário recebe convite, define senha
4. Sistema carrega sidebar com TODOS os módulos ativos — sem exceção
5. Usuário vê "Grade de Notas", "Chamada", "Prédio", "Voluntários", "Anamnese"
   independentemente de ser escola, academia, ONG ou empresa
```

**Problema operacional:** Não existe um fluxo de onboarding guiado. A nova instituição cai no sistema com 100% dos módulos ativos e precisa descobrir sozinha quais são relevantes para ela. Isso gera:
- Confusão ("o que é anamnese?")
- Desconfiança ("esse sistema não é para mim")
- Abandono precoce (churn no trial)

### O processo proposto no documento era:

```
1. Instituição escolhe tipo no onboarding ("Escola / Academia / ONG / Empresa")
2. Sistema configura feature_flags automaticamente
3. Sidebar mostra apenas módulos relevantes
4. Vocabulário correto desde o primeiro acesso
```

**Gap operacional:** O `src/pages/Onboarding.tsx` existe, mas precisamos verificar se ele coleta tipo de instituição.

**Métricas que não existem hoje mas deveriam:**
- Taxa de ativação por tipo de instituição
- Módulos mais acessados na primeira semana
- Taxa de abandono no onboarding
- Tempo médio até primeiro aluno cadastrado (Aha moment)

### Processo de importação como Aha moment

A implementação das fases A, B e C de importação é um ativo operacional excelente. O onboarding ideal seria:

```
Dia 1: Cria conta → escolhe tipo → feature flags configuradas
Dia 2-3: Importa alunos via planilha (Fase A)
Dia 4-5: Importa matrículas (Fase B)  
Dia 6-7: Importa histórico financeiro (Fase C) — opcional
Semana 2: Sistema está funcionando com dados reais → retenção ativada
```

Esse fluxo já é tecnicamente possível. O que falta é o passo zero: tipo de instituição → feature flags.

---

## 🖥️ CIO Engineer — Segurança e Compliance

### Achados de Segurança no Código

**1. `ProtectedRoute.tsx` — Admite vulnerabilidade explicitamente (linha 1-43):**
O componente tem comentário extenso dizendo que proteção por role é "UX only" e a segurança real está no RLS. Isso está correto na teoria. Mas quando adicionarmos feature flags, a mesma lógica se aplica: verificação de feature no frontend é UX, verificação no backend (RLS) é segurança.

**Ação necessária:** Assim que `feature_flags` existir no banco, criar policies RLS que negam acesso a dados de módulos desativados, não apenas esconder o item no menu.

**2. Dados de saúde (LGPD Art. 11) sem consentimento explícito rastreável:**

Tabelas afetadas:
- `anamneses` — dados de saúde completos
- `alunos.alergias`, `alunos.medicamentos` — dados médicos
- `anamneses.pne_cid`, `anamneses.pne_laudo` — dados sensíveis de deficiência

O sistema coleta esses dados mas não há evidência no código de:
- Checkbox de consentimento com timestamp
- Armazenamento de qual versão da política de privacidade o responsável aceitou
- Mecanismo de exclusão de dados por solicitação do titular

**Para instituições que têm o módulo SAÚDE ativo, isso é exposição legal real.**

**3. Auditoria existe mas é parcial:**

`supabase/migrations/20260216223000_audit_system.sql` — existe uma tabela `audit_logs`. Boa fundação. O que precisa evoluir:
- Registrar quando feature flags são alteradas
- Registrar acesso a dados de saúde especificamente
- Ter um relatório exportável para demonstrar compliance

**4. Dados de pagamento com `gateway_url`:**

`supabase/migrations/20260306041822_add_gateway_url_to_pagamentos.sql` adiciona `gateway_url` à tabela `pagamentos`. Verificar se esses URLs contêm tokens ou dados sensíveis que deveriam ser criptografados.

---

## 📣 CMO Architect — Posicionamento: O que o Código Comunica

### O produto diz "escola" em pelo menos 6 lugares visíveis

Análise de strings hardcoded encontradas na UI:

| Arquivo | Linha | String Problemática |
|---|---|---|
| `src/contexts/UnidadeContext.tsx` | 99 | `"escolas vinculadas"` |
| `src/pages/Financeiro.tsx` | 159 | `"saúde financeira da escola"` |
| `src/components/DashboardLayout.tsx` | 76 | grupo `"Acadêmico"` |
| `src/components/DashboardLayout.tsx` | 163 | `"Grade de Notas"` |
| `src/components/DashboardLayout.tsx` | 164 | `"Chamada / Frequência"` |
| `src/pages/professor/GradeAvaliacao.tsx` | - | conceito de `bimestre` (1-4) |
| `src/pages/CalendarioEscolar.tsx` | - | nome da página |

**Impacto de posicionamento:** Uma academia que faz demo do sistema veria pelo menos 3-4 dessas strings nas primeiras páginas que acessar. Conclusão imediata: "esse sistema é para escola, não para mim."

### O que isso custa em conversão estimada

Assumindo uma taxa de conversão baseline de 10% no trial:
- Com vocabulário neutro/correto para cada segmento → 10%
- Com vocabulário fixo de escola para não-escola → estimativa 3-4%
- Perda estimada: 60-70% dos leads de academias e empresas

### O ativo que não está sendo usado: sistema de indicação

O sistema de indicação (`codigo_indicacao` em `profiles`, `convidado_por`) existe no banco de dados desde `20260216210000_referral_system.sql`, mas **não aparece em nenhum item da sidebar** para nenhum role. É um motor de crescimento pronto que está dormindo.

Para ativar: criar uma página `/minha-indicacao` e adicionar ao sidebar do papel `responsavel` com a frase "Indique um amigo" — zero código novo no backend.

---

## 🤖 CAIO Architect — Inteligência: O que os Dados Podem Fazer Hoje

### Dados disponíveis vs. inteligência extraída

| Dado no banco | Inteligência possível | Status |
|---|---|---|
| `pagamentos.status` + `data_vencimento` | Predição de inadimplência | ❌ Não implementado |
| `chamadas.presente/ausente` por aluno | Alerta de evasão por frequência | ❌ Não implementado |
| `origem_cadastro JSONB` em `alunos` | ROI por canal de aquisição | ❌ Coleta existe, UI não consome |
| `codigo_indicacao` em `profiles` | Ranking de indicadores ativos | ❌ Coleta existe, UI não consome |
| `pagamentos.valor` + histórico | Sazonalidade de receita | ⚠️ Parcial (gráfico de 6 meses existe) |

### Oportunidade imediata sem nova infraestrutura

O banco já tem os dados. A inteligência que pode ser extraída com queries simples (sem ML):

**Alerta de evasão:** Aluno que faltou as últimas 3 aulas + tem pagamento pendente → notificação automática para coordenação. Isso é uma query simples na tabela `chamadas`, não precisa de ML.

**Receita por tipo de instituição:** Quando `tipo_instituicao` existir, será possível segmentar métricas por segmento. O produto poderá mostrar "escolas similares à sua têm receita média de R$ X" — social proof baseado em dados reais.

---

## 📋 Product Manager — Priorização Final com Esforço Real

### Sprint 1 — Unblock (2 semanas)

Estes itens bloqueiam qualquer avanço multi-tenant. Sem eles, nada do restante funciona.

**Tarefa 1.1 — Migration: `tipo_instituicao` + `feature_flags`**
```sql
ALTER TABLE unidades
  ADD COLUMN IF NOT EXISTS tipo_instituicao TEXT DEFAULT 'escola'
    CHECK (tipo_instituicao IN ('escola', 'academia', 'ong', 'empresa', 'custom')),
  ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{
    "saude": true, "predio": true, "academico": true,
    "comissoes": true, "calendario": true, "voluntarios": false,
    "indicacoes": false, "landing_publica": true
  }'::jsonb;
```
Esforço: 1h. Risco: baixíssimo (só ADD COLUMN, não quebra nada).

**Tarefa 1.2 — Criar `src/contexts/FeatureContext.tsx`**
```typescript
import { createContext, useContext } from "react";
import { useUnidade } from "./UnidadeContext";

export type FeatureKey = "saude"|"predio"|"academico"|"comissoes"|"calendario"|"voluntarios"|"indicacoes"|"landing_publica";

const DEFAULT_FLAGS: Record<FeatureKey, boolean> = {
  saude: true, predio: true, academico: true,
  comissoes: true, calendario: true, voluntarios: false,
  indicacoes: false, landing_publica: true
};

export const useFeature = (flag: FeatureKey): boolean => {
  const { currentUnidade } = useUnidade();
  const flags = (currentUnidade as any)?.feature_flags ?? DEFAULT_FLAGS;
  return flags[flag] ?? DEFAULT_FLAGS[flag];
};
```
Esforço: 2h. Zero risco (additive).

**Tarefa 1.3 — Atualizar `UnidadeContext.tsx`**

Adicionar `tipo_instituicao` e `feature_flags` à interface `Unidade` e ao SELECT da query.
Esforço: 1h. Zero risco.

**Tarefa 1.4 — Fix bug: Calendário na Sidebar**

`CalendarioEscolar` existe como rota mas não está em `getNavigationByRole()` para nenhum role. Adicionar para `direcao` e `coordenacao`.
Esforço: 30min. Zero risco. **Bug em produção hoje.**

---

### Sprint 2 — Sidebar Condicional (1 semana)

**Tarefa 2.1 — Refatorar `getNavigationByRole()` em `DashboardLayout.tsx`**

Converter para função que recebe feature flags e filtra itens condicionalmente:

```typescript
const getNavigationByRole = (role: string, features: Record<FeatureKey, boolean>) => {
  const nav = { ... }; // estrutura atual

  // Filtrar itens por feature
  return nav[role]?.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.feature && !features[item.feature]) return false;
      return true;
    })
  })).filter(group => group.items.length > 0) || [];
};
```

Cada item do nav ganha uma propriedade opcional `feature?: FeatureKey`:
```typescript
{ name: "Prédio", href: "/predio", icon: Building2, feature: "predio" },
{ name: "Voluntários", href: "/coordenacao/voluntarios", feature: "voluntarios" },
{ name: "Grade de Notas", ..., feature: "academico" },
{ name: "Comissões", ..., feature: "comissoes" },
{ name: "Anamnese", ..., feature: "saude" },
```

Esforço: 4h. Risco baixo (lógica aditiva, itens sem `feature` continuam aparecendo normalmente).

**Tarefa 2.2 — Corrigir vocabulário hardcoded (Quick Wins)**

Arquivo | Mudança
---|---
`UnidadeContext.tsx:99` | `"Não foi possível carregar as unidades vinculadas."`
`Financeiro.tsx:159` | `"Visão geral da saúde financeira da unidade"`
`DashboardLayout.tsx:76` | Renomear grupo "Acadêmico" → "Programas" (neutro para todos)

Esforço: 30min. Zero risco.

---

### Sprint 3 — Proteção e Onboarding (2 semanas)

**Tarefa 3.1 — `ProtectedRoute` com `allowedFeature`**
```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  allowedFeature?: FeatureKey; // NOVO
}
```
Se `allowedFeature` está definido e a feature está desativada, redireciona para `/dashboard` com toast explicativo.

**Tarefa 3.2 — Aba "Módulos" em Configurações**
Tela simples com toggles — apenas para role `direcao`. Salva no banco via UPDATE em `unidades.feature_flags`.

**Tarefa 3.3 — Onboarding com seletor de tipo**
Adicionar ao fluxo de `src/pages/Onboarding.tsx` a pergunta "Qual melhor descreve sua organização?" com 4 cards. A escolha define `tipo_instituicao` e pré-configura `feature_flags`.

---

## 🏁 Vision Chief — Síntese e Decisão

### O estado real vs. o estado proposto

```
ESTADO HOJE:
- Sistema multi-tenant ✅ (RLS + unidade_id funcionando)
- Feature toggles ❌ (não existem nem no banco)
- Sidebar condicional ❌ (100% hardcoded)
- Vocabulário genérico ❌ (DNA escolar em 6+ lugares)
- Bug ativo ❌ (Calendário inacessível via UI)
- Motor de indicação dormindo ❌ (banco pronto, UI ausente)
- LGPD em dados de saúde ⚠️ (sem consentimento rastreável)

ESTADO APÓS SPRINTS 1+2 (3 semanas de trabalho):
- Feature toggles ✅
- Sidebar condicional ✅
- Vocabulário neutro nas strings críticas ✅
- Bug do Calendário corrigido ✅
- Fundação para onboarding multi-tipo ✅
```

### A decisão executiva

**Iniciar Sprint 1 imediatamente.** É 100% aditivo (sem risco de regressão), o Neo Missio continua funcionando exatamente como hoje, e abre a porta para o Sprint 2 e 3.

**O maior risco não é técnico — é de prioridade.** Cada semana que o sistema continuar dizendo "escola" para academias e ONGs é uma semana de conversão perdida. O custo de implementação (Sprint 1+2 = ~10h de desenvolvimento) é ordens de grandeza menor do que o custo de leads que abandonam o trial.

**O bug do Calendário** deve ser corrigido hoje, antes de qualquer outra coisa. É uma funcionalidade já implementada que está invisível na navegação.

### Accountability

| Sprint | Owner | Prazo | Critério de Sucesso |
|---|---|---|---|
| Bug Calendário | Dev | Hoje | CalendarioEscolar aparece no sidebar da Direção |
| Sprint 1 | CTO / Dev | Semana 1 | `feature_flags` no banco + `useFeature()` hook funcionando |
| Sprint 2 | CTO / Dev | Semana 2-3 | Sidebar oculta Prédio, Voluntários, Grade quando feature desativada |
| Sprint 3 | CTO + CPO | Semana 4-6 | Onboarding pergunta tipo; módulos configurados automaticamente |

---

*Análise executada pela Squad C-Level — Neomissio — 08 de Junho de 2026*
*Próxima revisão: Após conclusão do Sprint 1*
*Referência: `docs/squad/multi-instituicao-feature-toggles.md`*
