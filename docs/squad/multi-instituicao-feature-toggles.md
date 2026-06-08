# Análise Squad C-Level: Plataforma Multi-Instituição com Feature Toggles

> **Sessão de Roundtable Executivo** — 08 de Junho de 2026
> **Tema:** Como transformar o sistema atual (construído sobre o Neo Missio) em uma plataforma genérica capaz de atender empresas, ONGs e escolas — mantendo a identidade de cada instituição e ativando apenas os módulos que fazem sentido para o seu contexto.
> **Triggado por:** "O sistema deve ser para qualquer empresa, ONG e escola. Então algumas coisas precisam ter algum toggle para ativar e desativar."

---

## 👔 Vision Chief — O Diagnóstico Estratégico

### Por que isso importa agora

O sistema foi construído com DNA de projeto social (Neo Missio) — uma ONG que oferece atividades esportivas, culturais e terapêuticas, com alunos, responsáveis, professores e gestão de prédio. Isso é rico e funcional. Mas ao mesmo tempo, é o maior risco de vendabilidade futura.

**O problema não é a funcionalidade. É o vocabulário e a rigidez.**

Quando uma academia tenta usar o sistema e vê "Série Escolar", "Anamnese PNE" e "Calendário Escolar" — ela abandona antes de tentar. Quando uma empresa de cursos tenta usar e vê "Gestão do Prédio", fica confusa. O sistema atual diz "você precisa se encaixar em mim" — um produto SaaS vencedor diz "eu me encaixo em você".

### A Visão Correta

Não estamos construindo um sistema para escolas. Não estamos construindo um sistema para ONGs. Estamos construindo uma **plataforma de gestão para qualquer instituição que tenha pessoas em atividades com responsáveis financeiros e professores/instrutores**.

Isso é um TAM radicalmente maior.

### O Modelo Mental Correto: Núcleo + Módulos

```
NÚCLEO (sempre ativo, para todos)
├── Pessoas (Alunos → genérico: Membros/Participantes)
├── Atividades
├── Turmas
├── Matrículas
├── Pagamentos + Cobranças
├── Autenticação + Roles
└── Importação de Dados (Fases A, B, C)

MÓDULOS OPCIONAIS (feature toggles por instituição)
├── [SAÚDE]       Anamnese, PNE, dados médicos
├── [PREDIO]      Gestão do espaço físico, locações, custos
├── [ACADEMICO]   Série escolar, grade de avaliação, chamada formal
├── [COMISSOES]   Comissões para professores/instrutores
├── [CALENDARIO]  Calendário escolar com feriados e eventos
├── [VOLUNTARIOS] Gestão de voluntários (role Secretaria)
├── [INDICACOES]  Sistema de referência e rastreio de leads
└── [LANDING]     Editor de landing page pública + matrícula online
```

### Routing Executivo

Esta análise envolve tecnologia (CTO), operações (COO), produto (PM), marketing (CMO) e infraestrutura (CIO). Vou chamar todos.

---

## 🔧 CTO Architect — Arquitetura de Feature Toggles

### Estado Atual: O que temos

O sistema tem 30+ páginas, todas hard-coded para o contexto do Neo Missio. As referências específicas estão em:

| Módulo | Onde está | Problema |
|--------|-----------|----------|
| Anamnese / PNE | `pages/responsavel/Anamnese.tsx`, campos `pne_cid`, `pne_laudo` em `anamneses` | Acoplado ao vocabulário médico-escolar |
| Prédio | `pages/Predio.tsx`, tabela `custos_predio`, tabela `locacoes` | Nome "Prédio" não faz sentido para academia ou empresa |
| Série Escolar | Campos `serie`, `escola` na tabela `alunos` | Irrelevante para cursos livres ou academias |
| Chamada | `pages/professor/Chamada.tsx` | Formato escolar (ausência/presença por lista) |
| Grade Avaliação | `pages/professor/GradeAvaliacao.tsx` | Conceito de "nota" — irrelevante para esporte |
| Comissões | `pages/professor/Comissoes.tsx` | Nem toda instituição paga comissão |
| Calendário Escolar | `pages/CalendarioEscolar.tsx` | Nome "escolar" é excludente |
| Voluntários/Secretaria | Role `secretaria`, `pages/secretaria/*` | Específico de ONGs |
| Landing Editor | `pages/direcao/LandingEditor.tsx` | Valioso para todos, mas o modelo de dados é fixo |

### ADR-001: Estratégia de Feature Toggles

**Status:** Proposto

**Contexto:** Precisamos de um mecanismo para ativar/desativar módulos por tenant (instituição) sem deploys separados e sem código morto acumulando.

**Decisão:** Implementar feature flags no nível de `unidades` (tabela já existente no banco) — um campo JSONB `feature_flags` na tabela `unidades` controla quais módulos estão ativos para cada instituição.

**Estrutura proposta:**

```sql
-- Migration futura
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{
  "saude": true,
  "predio": true,
  "academico": false,
  "comissoes": true,
  "calendario": true,
  "voluntarios": false,
  "indicacoes": false,
  "landing_publica": true
}'::jsonb;
```

**No frontend — Context de Features:**

```typescript
// src/contexts/FeatureContext.tsx
interface FeatureFlags {
  saude: boolean;        // Anamnese, PNE, dados médicos
  predio: boolean;       // Gestão do espaço físico e locações
  academico: boolean;    // Série, grade de avaliação, chamada formal
  comissoes: boolean;    // Comissões para instrutores
  calendario: boolean;   // Calendário de eventos
  voluntarios: boolean;  // Role secretaria e voluntários
  indicacoes: boolean;   // Sistema de referência/leads
  landing_publica: boolean; // Landing page e matrícula online
}

export const useFeature = (flag: keyof FeatureFlags): boolean => {
  const { currentUnidade } = useUnidade();
  return currentUnidade?.feature_flags?.[flag] ?? false;
};
```

**Uso no componente:**

```typescript
// Em qualquer página/sidebar
const temSaude = useFeature("saude");
const temPredio = useFeature("predio");

// No sidebar — só mostra o item se o módulo estiver ativo
{temPredio && <SidebarItem href="/predio" icon={Building} label="Espaço Físico" />}
{temSaude && <SidebarItem href="/anamnese" icon={Heart} label="Saúde" />}
```

**Trade-offs:**

| Ganho | Custo |
|-------|-------|
| Zero deploys para ativar/desativar módulos | JSONB na tabela requer validação no app |
| Configuração por instituição, granular | Necessita tela de admin para gerenciar os toggles |
| Retrocompatível — Neo Missio não muda | Testes precisam cobrir combinações de flags |
| Escala bem para 100+ tenants | Não impede acesso via URL direto (precisa de ProtectedRoute por feature) |

**Consequências:** O `ProtectedRoute` precisará de uma verificação adicional: `allowedFeature?: keyof FeatureFlags`. Se a feature estiver desligada, redireciona para o dashboard com uma mensagem contextual.

---

### ADR-002: Renomeação Semântica (Vocabulário Genérico)

**Status:** Proposto

O código interno não muda — mas as strings exibidas ao usuário e os nomes de rotas devem poder ser configuradas por tipo de instituição. Proposta:

| Atual (fixo) | Genérico | Escola | Academia/Esporte | ONG |
|---|---|---|---|---|
| Aluno | Membro | Aluno | Atleta/Aluno | Beneficiário |
| Responsável | Responsável | Responsável | Responsável | Responsável |
| Professor | Instrutor | Professor | Técnico/Professor | Voluntário/Monitor |
| Atividade | Programa | Disciplina/Atividade | Modalidade | Programa |
| Turma | Turma | Turma | Turma/Grupo | Turma |
| Prédio | Espaço | Escola | Arena/Espaço | Sede |
| Direção | Gestão | Direção | Gestão | Coordenação |

**Implementação recomendada:** Um objeto `vocabulary` no `UnidadeContext`, populado pelo campo `tipo_instituicao` (enum: `escola`, `academia`, `ong`, `empresa`, `custom`) na tabela `unidades`. O `tipo_instituicao` também determina os feature flags padrão ao criar uma nova conta.

```typescript
const VOCABULARY_MAP: Record<TipoInstituicao, Vocabulary> = {
  escola:   { aluno: "Aluno",       instrutor: "Professor",  espaco: "Escola" },
  academia: { aluno: "Atleta",      instrutor: "Técnico",    espaco: "Arena" },
  ong:      { aluno: "Beneficiário",instrutor: "Monitor",    espaco: "Sede" },
  empresa:  { aluno: "Participante",instrutor: "Instrutor",  espaco: "Espaço" },
  custom:   { /* configurável pelo admin */ }
};
```

---

## 📦 COO Orchestrator — Análise Módulo por Módulo

### Mapa de Relevância por Tipo de Instituição

| Módulo | Escola | Academia/Esporte | ONG Projeto Social | Empresa/Cursos |
|--------|--------|------------------|--------------------|----------------|
| **NÚCLEO** (Alunos, Atividades, Matrículas, Pagamentos) | ✅ | ✅ | ✅ | ✅ |
| **SAÚDE** (Anamnese, PNE, laudos) | ✅ Crítico | ✅ Importante | ✅ Crítico | ⚠️ Opcional |
| **PRÉDIO** (Custos, Locações) | ✅ | ✅ | ✅ | ⚠️ Só se tiver espaço |
| **ACADÊMICO** (Série, Notas, Chamada formal) | ✅ Crítico | ❌ | ⚠️ Parcial | ❌ |
| **COMISSÕES** (Pagamento a instrutores) | ✅ | ✅ | ❌ Voluntários | ✅ |
| **CALENDÁRIO** (Eventos, feriados) | ✅ | ✅ | ✅ | ⚠️ Depende |
| **VOLUNTÁRIOS** (Role Secretaria) | ❌ Raro | ❌ | ✅ Crítico | ❌ |
| **INDICAÇÕES** (Referral, leads) | ⚠️ Crescimento | ✅ | ⚠️ | ✅ |
| **LANDING + Matrícula Online** | ✅ | ✅ | ✅ | ✅ |
| **IMPORTAÇÃO** (Fases A, B, C) | ✅ Onboarding | ✅ | ✅ | ✅ |

### Prioridade de Implementação dos Toggles (90 dias)

**Sprint 1 (urgente — bloqueia vendas):**
1. Campo `tipo_instituicao` na tabela `unidades` (enum)
2. Campo `feature_flags` JSONB na tabela `unidades`
3. `FeatureContext` no frontend
4. Sidebar condicional por feature
5. `ProtectedRoute` com `allowedFeature`

**Sprint 2 (melhora conversão):**
6. Vocabulário dinâmico pelo `tipo_instituicao`
7. Tela de Configurações → aba "Módulos" (para Direção ativar/desativar)
8. Feature flags padrão por tipo ao criar conta (onboarding flow)

**Sprint 3 (completude comercial):**
9. Relatório por tipo de instituição (métricas que fazem sentido para cada um)
10. Templates de importação específicos por tipo (ex: template academia tem "modalidade" em vez de "série")

---

## 🎯 CMO Architect — Posicionamento e Go-to-Market

### O Sistema como Produto: Segmentação de Mercado Brasileira

**Segmento 1: Projetos Sociais e ONGs**
- TAM Brasil: ~820k ONGs registradas
- Pain point principal: gestão amadora em planilhas, inadimplência invisível, sem histórico de pagamentos
- Vocabulário: beneficiários, voluntários, doadores, programa social
- Feature set ideal: NÚCLEO + SAÚDE + VOLUNTÁRIOS + IMPORTAÇÃO
- Preço sensível: plano acessível (impacto social)

**Segmento 2: Escolas Esportivas e Academias**
- TAM Brasil: ~97k estabelecimentos de atividade física
- Pain point: controle de pagamentos, chamada, comissão de professores
- Vocabulário: atletas, técnicos, modalidades, turmas
- Feature set ideal: NÚCLEO + SAÚDE + COMISSÕES + CALENDARIO + LANDING
- Preço médio: plano padrão

**Segmento 3: Cursos Livres e Treinamentos**
- TAM Brasil: ~44k escolas privadas de educação livre
- Pain point: matrículas, pagamentos, controle de presença, relatórios para responsáveis
- Feature set ideal: NÚCLEO + ACADÊMICO (parcial) + COMISSÕES + LANDING
- Preço médio-alto: plano profissional

**Segmento 4: Escolas Formais (Ensino Fundamental/Médio)**
- TAM Brasil: ~80k escolas privadas
- Pain point: gestão completa — série, notas, chamada, financeiro
- Feature set ideal: TODOS os módulos ativos
- Preço alto: plano enterprise

### Mensagem de Posicionamento Único

> **"O sistema que fala a língua da sua instituição — seja ela uma escola, uma academia ou um projeto social."**

O diferencial não é ter mais funcionalidades — é ter as funcionalidades certas, ativas para o perfil certo, desde o primeiro dia.

### Funil de Conversão por Tipo

```
1. Landing page pública com seletor de tipo de instituição
2. Onboarding inteligente: "O que melhor descreve sua organização?"
   → [Escola] [Academia/Esporte] [ONG/Projeto Social] [Empresa/Cursos]
3. Feature flags configuradas automaticamente com base na escolha
4. Trial de 14 dias com dados de demonstração no vocabulário correto
5. Importação de planilha na semana 1 → ponto de ativação (Aha moment)
```

---

## 💻 CIO Engineer — Segurança, Dados e Multi-Tenancy

### RLS (Row Level Security) — Estado Atual e Multi-Tenant

O sistema já usa RLS com `unidade_id` na maioria das tabelas. Isso é a base correta para multi-tenant. O que precisa evoluir:

**Checklist de segurança para multi-instituição:**

- [x] Todas as tabelas têm `unidade_id`
- [x] RLS ativo com políticas baseadas em `unidade_id`
- [ ] `feature_flags` precisam ser verificadas no backend via RLS policies (não apenas no frontend)
- [ ] Logs de auditoria por tenant (quem importou o quê, quando)
- [ ] Limite de armazenamento por plano (importações de arquivos grandes)
- [ ] LGPD: dados de saúde (anamnese, PNE) precisam de consentimento explícito — verificar se o checkbox de consentimento existe no fluxo do responsável

### Dados Sensíveis — Módulo SAÚDE

Os campos `pne_cid`, `pne_laudo` e a tabela `anamneses` contêm dados sensíveis de saúde. Sob a LGPD:

1. Esses dados só devem ser coletados com consentimento explícito documentado
2. Apenas papéis com necessidade operacional devem ter acesso (direção, coordenação — não professores comuns)
3. Quando o módulo SAÚDE está desativado via feature toggle, as RLS policies devem bloquear acesso mesmo que alguém tente via URL direta

**Recomendação:** Criar policy de RLS que verifique `feature_flags->>'saude' = 'true'` na unidade antes de permitir SELECT/INSERT em `anamneses`.

### Planos e Limites

| Plano | Usuários | Alunos | Módulos Incluídos |
|-------|----------|--------|-------------------|
| Social (ONG) | 5 | 200 | NÚCLEO + SAÚDE + VOLUNTÁRIOS |
| Starter | 10 | 500 | NÚCLEO + SAÚDE + COMISSÕES + LANDING |
| Profissional | 25 | 2000 | TODOS |
| Enterprise | Ilimitado | Ilimitado | TODOS + suporte dedicado |

---

## 🤖 CAIO Architect — Inteligência e Automação por Tipo

### Oportunidades de IA por Módulo

**SAÚDE:** IA pode detectar padrões de frequência x saúde — alunos com laudo PNE que faltam mais, correlação entre anamnese e abandono. Gera insights para coordenação agir preventivamente.

**FINANCEIRO:** O sistema já tem inadimplência em tempo real. A próxima camada: predição de inadimplência (aluno que falta 3 semanas seguidas tem 70% de chance de cancelar no mês seguinte). Essa predição deve aparecer na Central de Cobrança.

**INDICAÇÕES:** Se o módulo estiver ativo, IA pode identificar quais alunos têm mais probabilidade de indicar novos membros (baseado em tempo de engajamento, presença alta, pagamentos em dia).

**IMPORTAÇÃO:** A fase de parse/validação já é inteligente. A próxima iteração: IA que sugere o mapeamento de colunas automaticamente ("parece que sua coluna 'Nome do Aluno' corresponde a 'nome_completo'").

---

## 📋 Product Manager — Roadmap de Implementação

### Análise de Esforço x Impacto

| Ação | Esforço | Impacto | Prioridade |
|------|---------|---------|------------|
| Campo `tipo_instituicao` + `feature_flags` no banco | Baixo (1 migration) | Alto | 🔴 P0 |
| `FeatureContext` + `useFeature()` hook | Médio (2 dias) | Alto | 🔴 P0 |
| Sidebar condicional por feature | Médio (3 dias) | Alto | 🔴 P0 |
| ProtectedRoute com `allowedFeature` | Baixo (1 dia) | Alto | 🔴 P0 |
| Aba "Módulos" em Configurações | Médio (2 dias) | Médio | 🟡 P1 |
| Vocabulário dinâmico por tipo | Alto (5 dias) | Alto | 🟡 P1 |
| Feature flags padrão no onboarding | Médio (2 dias) | Alto | 🟡 P1 |
| RLS verificando feature_flags | Médio (2 dias) | Alto (segurança) | 🟡 P1 |
| Relatórios por tipo de instituição | Alto (7 dias) | Médio | 🟢 P2 |
| IA de predição de inadimplência | Alto (14+ dias) | Alto | 🟢 P2 |

### Critérios de Aceite — MVP Multi-Instituição

Para considerar o sistema "genérico o suficiente" para comercialização:

- [ ] Uma academia consegue criar conta, desativar "Módulo Acadêmico" e "Voluntários", e usar o sistema sem ver campos irrelevantes
- [ ] Uma ONG consegue criar conta, ativar "Voluntários" e "Saúde", e o sistema usa o vocabulário correto
- [ ] Uma escola consegue criar conta, ativar todos os módulos, e tem a experiência completa atual
- [ ] Nenhum tipo de instituição vê funcionalidades que não fazem sentido para o seu contexto
- [ ] O onboarding pergunta o tipo e configura os módulos automaticamente (sem precisar ir em Configurações manualmente)

---

## 🏁 Síntese do Vision Chief — Decisão Executiva

### O que decidimos

1. **A base está correta.** O modelo de dados com `unidade_id`, RLS, e a estrutura de roles é o alicerce certo para multi-tenant. Não precisamos reescrever — precisamos abstrair.

2. **Feature toggles via JSONB em `unidades` é a arquitetura certa.** Simples, retrocompatível, configurável por instituição, sem deploys separados.

3. **O vocabulário precisa ser dinâmico.** "Aluno" vs "Atleta" vs "Beneficiário" não é detalhe cosmético — é o que determina se o cliente se identifica com o produto na demo.

4. **Prioridade de comercialização:** ONGs e projetos sociais primeiro (menor resistência, maior fit com o DNA atual), depois academias esportivas (maior volume de mercado e disposição de pagar), depois escolas formais (maior ticket, maior complexidade de venda).

5. **O maior risco não é técnico — é de posicionamento.** O sistema precisa comunicar "eu sou para você" desde a landing page, antes mesmo de o usuário criar conta.

### Os 3 próximos passos obrigatórios

```
[1] CTO executa Sprint 1 — feature_flags no banco + FeatureContext + sidebar condicional
    → Prazo: próximas 2 semanas
    → Entrega: Neo Missio funciona igual, mas a infra de toggles está pronta

[2] COO + PM definem os perfis de feature por tipo de instituição
    → Prazo: 1 semana (pode rodar em paralelo com Sprint 1)
    → Entrega: Tabela definitiva de "tipo X → features ativas por default"

[3] CMO define o copy da landing page com seletor de tipo de instituição
    → Prazo: 2 semanas
    → Entrega: Página pública que fala com os 4 segmentos identificados
```

### O que NÃO fazer

- ❌ Não reescrever o sistema do zero para ser "mais genérico" — o custo não vale o risco
- ❌ Não criar instâncias separadas por tipo de cliente — multi-tenant via feature_flags é o caminho
- ❌ Não renomear tabelas e colunas no banco — a abstração acontece no frontend e na camada de vocabulário
- ❌ Não atrasar o início por buscar a arquitetura perfeita — a solução proposta aqui é boa o suficiente para os próximos 18 meses

---

*Documento gerado pela Squad C-Level — Neomissio — Junho 2026*
*Próxima revisão: Após conclusão do Sprint 1 de Feature Toggles*
