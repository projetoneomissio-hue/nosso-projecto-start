# Roadmap Completo - Sistema Neo Missio

## 📋 Visão Geral do Sistema

Sistema completo de gestão para projeto social que oferece múltiplas atividades (esportivas, educacionais, terapêuticas) com controle de alunos, professores, coordenadores, matrículas, pagamentos, presenças e finanças.

---

## 🎯 Estrutura de Papéis (Roles)

### 1. **Direção** (Admin Máximo)
- Acesso total ao sistema
- Gerencia todos os usuários e convites
- Visualiza relatórios financeiros completos
- Gerencia coordenadores, professores e atividades

### 2. **Coordenação**
- Gerencia atividades específicas atribuídas
- Aprova/rejeita matrículas
- Visualiza inadimplentes de suas atividades
- Envia notificações
- Gerencia turmas de suas atividades

### 3. **Professor**
- Visualiza suas turmas e alunos
- Registra presença
- Adiciona observações sobre alunos
- Consulta comissões

### 4. **Responsável** (Público)
- Cadastra alunos (filhos/dependentes)
- Solicita matrículas em atividades
- Visualiza pagamentos
- Registra pagamentos realizados
- Preenche anamnese
- Acompanha relatórios do aluno

---

## 🗺️ Roadmap de Implementação

### ✅ **FASE 1: FUNDAÇÃO (Concluído)**

#### 1.1 Landing Page Pública
- ✅ Página inicial com informações do projeto
- ✅ Lista de 11 atividades oferecidas (2026)
- ✅ Descrições, horários, valores e público-alvo
- ✅ Seção de depoimentos
- ✅ Logo e identidade visual
- ✅ Informações de contato (WhatsApp, endereço)

#### 1.2 Autenticação e Segurança
- ✅ Sistema de login/logout
- ✅ MFA (Multi-Factor Authentication) para roles administrativos
- ✅ Sistema de convites para admin (Direção, Coordenação, Professor)
- ✅ Signup público apenas para Responsável
- ✅ Validação de token de convite
- ✅ Códigos de recuperação MFA
- ✅ RLS (Row Level Security) em todas as tabelas

#### 1.3 Estrutura de Banco de Dados
**Tabelas Principais:**
- ✅ `profiles` - Dados básicos dos usuários
- ✅ `user_roles` - Atribuição de papéis
- ✅ `invitations` - Sistema de convites
- ✅ `mfa_recovery_codes` - Códigos de recuperação 2FA
- ✅ `atividades` - Atividades oferecidas
- ✅ `turmas` - Turmas de cada atividade
- ✅ `coordenador_atividades` - Mapeamento coordenador-atividade
- ✅ `professores` - Professores e comissões
- ✅ `alunos` - Alunos cadastrados
- ✅ `matriculas` - Matrículas em turmas
- ✅ `pagamentos` - Pagamentos mensais
- ✅ `presencas` - Registro de presença
- ✅ `observacoes` - Observações dos professores
- ✅ `anamneses` - Fichas de saúde/médicas
- ✅ `custos_predio` - Custos operacionais
- ✅ `funcionarios` - Funcionários não-professores
- ✅ `locacoes` - Locação do espaço

**Funções de Segurança:**
- ✅ `has_role()` - Verifica papel do usuário
- ✅ `is_coordenador_atividade()` - Verifica coordenação
- ✅ `is_coordenador_turma()` - Verifica coordenação de turma
- ✅ `is_professor_turma()` - Verifica professor da turma
- ✅ `is_responsavel_aluno()` - Verifica responsável do aluno
- ✅ `mask_cpf()` - Mascara CPF para não-diretores
- ✅ `validate_invitation_token()` - Valida convites
- ✅ `validate_recovery_code()` - Valida códigos MFA

---

### ✅ **FASE 2: GESTÃO ADMINISTRATIVA (Concluído)**

#### 2.1 Módulo Direção
- ✅ **Usuários** (`/direcao/usuarios`) - Lista e gerencia todos os usuários
- ✅ **Convites** (`/convites`) - Cria convites para admin (Coordenação, Professor)
- ✅ **Coordenadores** (`/direcao/coordenadores`) - Atribui coordenadores a atividades
- ✅ **Matrículas** (`/direcao/matriculas`) - Visualiza todas as matrículas
- ✅ **Professores** (`/professores`) - Gerencia professores
- ✅ **Atividades** (`/atividades`) - CRUD completo de atividades
- ✅ **Alunos** (`/alunos`) - Visualiza todos os alunos
- ✅ **Financeiro** (`/financeiro`) - Relatórios financeiros completos
- ✅ **Prédio** (`/predio`) - Custos operacionais e locações
- ✅ **Notificações** (`/coordenacao/notificacoes`) - Envia notificações

#### 2.2 Módulo Coordenação
- ✅ **Minhas Atividades** (`/atividades`) - Visualiza atividades coordenadas
- ✅ **Turmas** (`/coordenacao/turmas`) - CRUD de turmas de suas atividades
- ✅ **Alunos** (`/alunos`) - Visualiza alunos de suas atividades
- ✅ **Matrículas Pendentes** (`/coordenacao/matriculas-pendentes`) - Aprova/rejeita matrículas
  - ✅ Geração automática de 12 pagamentos ao aprovar
- ✅ **Inadimplentes** (`/coordenacao/inadimplentes`) - Lista inadimplentes
- ✅ **Notificações** (`/coordenacao/notificacoes`) - Envia lembretes
- ✅ **Relatórios** (`/coordenacao/relatorios`) - Relatórios de suas atividades
- ✅ **Financeiro** (`/financeiro`) - Dados financeiros filtrados

---

### ✅ **FASE 3: GESTÃO DE ENSINO (Concluído)**

#### 3.1 Módulo Professor
- ✅ **Minhas Turmas** (`/professor/turmas`) - Lista turmas atribuídas
- ✅ **Meus Alunos** (`/professor/alunos`) - Lista alunos das turmas
- ✅ **Presença** (`/professor/presenca`) - Registro de presença
- ✅ **Observações** (`/professor/observacoes`) - Adiciona observações sobre alunos
- ✅ **Comissões** (`/professor/comissoes`) - Visualiza comissões

---

### ✅ **FASE 4: ÁREA DO RESPONSÁVEL (Concluído)**

#### 4.1 Módulo Responsável
- ✅ **Cadastrar Aluno** (`/responsavel/cadastrar-aluno`) - Cadastra novos alunos
- ✅ **Nova Matrícula** (`/responsavel/nova-matricula`) - Solicita matrícula em atividade
- ✅ **Atividades Matriculadas** (`/responsavel/atividades-matriculadas`) - Lista matrículas ativas
- ✅ **Pagamentos** (`/responsavel/pagamentos`) - Visualiza pagamentos pendentes/realizados
- ✅ **Registrar Pagamento** (`/responsavel/registrar-pagamento`) - Registra pagamento realizado
  - ✅ Formas de pagamento: PIX, Dinheiro, Cartão, Boleto, Transferência
- ✅ **Anamnese** (`/responsavel/anamnese`) - Preenche ficha médica/saúde
- ✅ **Relatórios do Aluno** (`/responsavel/relatorios-aluno`) - Visualiza observações e presença

---

### ✅ **FASE 5: NOTIFICAÇÕES (Concluído)**

#### 5.1 Sistema de Notificações
- ✅ Edge Function: `send-payment-reminder` - Lembrete de pagamento individual
- ✅ Edge Function: `send-notifications` - Envio em lote
- ✅ Edge Function: `send-invitation-email` - Envio de convites
- ✅ Integração com Gmail SMTP
- ✅ Painel de controle de notificações (`/coordenacao/notificacoes`)
- ✅ Estatísticas em tempo real:
  - Pagamentos próximos do vencimento (5 dias)
  - Pagamentos atrasados
  - Matrículas pendentes (>3 dias)

**Tipos de Notificações:**
- ✅ Lembrete de Pagamento (5 dias antes)
- ✅ Pagamento Atrasado
- ✅ Matrícula Pendente de Aprovação

---

### ✅ **FASE 6: RELATÓRIOS FINANCEIROS (Concluído)**

#### 6.1 Dashboard Financeiro
- ✅ KPIs em tempo real:
  - Receita mensal
  - Despesas mensais
  - Lucro líquido
  - Taxa de inadimplência
- ✅ Gráficos:
  - Receita mensal (linha)
  - Receita por atividade (pizza)
- ✅ Lista de inadimplentes:
  - Nome do aluno
  - Atividade
  - Dias de atraso
  - Valor devido
  - Ações (notificar, negociar)
- ✅ Exportação para PDF

---

## 🚀 **FASE 7: MELHORIAS FUTURAS (Planejado)**

### 7.1 Automação Completa
- ⏳ Cron Jobs no Supabase:
  - Envio automático diário de lembretes de pagamento
  - Atualização automática de status de pagamentos atrasados
  - Alertas de turmas próximas da capacidade máxima

### 7.2 Notificações In-App
- ⏳ Sistema de notificações dentro do app
- ⏳ Badge de contador de notificações não lidas
- ⏳ Central de notificações com histórico
- ⏳ Notificações push (Progressive Web App)

### 7.3 Integração WhatsApp
- ⏳ Notificações via WhatsApp (Evolution API ou Twilio)
- ⏳ Lembretes de pagamento automáticos
- ⏳ Confirmação de presença via WhatsApp
- ⏳ Bot de atendimento básico

### 7.4 Relatórios Avançados
- ⏳ Relatório de frequência por aluno/turma
- ⏳ Relatório de evolução de alunos
- ⏳ Relatório de comissões de professores
- ⏳ Relatório de taxa de evasão
- ⏳ Exportação em Excel/CSV

### 7.5 Dashboard Personalizado por Role
- ⏳ Dashboard específico para cada papel
- ⏳ Widgets customizáveis
- ⏳ Métricas relevantes por role
- ⏳ Gráficos interativos

### 7.6 Backup e Auditoria
- ⏳ Backup automático do banco de dados
- ⏳ Log de auditoria de alterações críticas
- ⏳ Histórico de aprovações de matrícula
- ⏳ Rastro de alterações de pagamentos

### 7.7 Portal do Aluno
- ⏳ Acesso direto do aluno (não apenas responsável)
- ⏳ Visualização de histórico escolar/desempenho
- ⏳ Upload de documentos
- ⏳ Chat com professor/coordenação

### 7.8 Sistema de Avaliações
- ⏳ Avaliações periódicas de alunos
- ⏳ Feedback de professores
- ⏳ Relatórios de progresso
- ⏳ Certificados de conclusão

### 7.9 Gestão de Vagas
- ⏳ Lista de espera automática
- ⏳ Notificação quando vaga abrir
- ⏳ Priorização de lista de espera

### 7.10 Gestão de Eventos
- ⏳ Cadastro de eventos especiais
- ⏳ Inscrições em eventos
- ⏳ Galeria de fotos de eventos
- ⏳ Calendário de eventos

---

## 📊 Fluxos de Trabalho Principais

### Fluxo 1: Novo Aluno se Matriculando
1. **Responsável** acessa landing page pública
2. Cria conta no sistema (role: responsável)
3. Faz login
4. Cadastra aluno (filho/dependente)
5. Solicita matrícula em atividade específica
6. **Coordenação/Direção** recebe solicitação
7. Aprova/rejeita matrícula
8. Se aprovada: 12 pagamentos mensais são gerados automaticamente
9. **Responsável** visualiza pagamentos pendentes
10. Realiza pagamento e registra no sistema
11. **Responsável** preenche anamnese (se necessário)
12. Aluno está matriculado e ativo!

### Fluxo 2: Professor Dando Aula
1. **Professor** faz login
2. Acessa "Minhas Turmas"
3. Seleciona turma da aula
4. Registra presença dos alunos
5. Adiciona observações sobre alunos (opcional)
6. Consulta suas comissões

### Fluxo 3: Coordenação Gerenciando Inadimplentes
1. **Coordenação** faz login
2. Acessa "Inadimplentes"
3. Visualiza lista de alunos com pagamentos atrasados
4. Acessa "Notificações"
5. Envia lembrete automático por email
6. Acompanha resolução

### Fluxo 4: Direção Criando Novo Professor
1. **Direção** faz login
2. Acessa "Convites"
3. Cria convite para novo professor (email + role)
4. Professor recebe email com token
5. Professor acessa link do convite
6. Cria conta no sistema
7. **Direção** acessa "Professores"
8. Completa dados do professor (especialidade, comissão)
9. Atribui turmas ao professor

---

## 🔐 Segurança Implementada

### Políticas RLS Principais
- ✅ Usuários só veem seus próprios dados
- ✅ Responsáveis só veem dados de seus alunos
- ✅ Professores só veem dados de suas turmas
- ✅ Coordenadores só veem dados de suas atividades
- ✅ Direção tem acesso total
- ✅ CPF mascarado para não-diretores
- ✅ Convites validados com token e expiração
- ✅ MFA obrigatório para roles admin

### Proteções de Dados Sensíveis
- ✅ CPF com mascaramento (`***.***.***-XX`)
- ✅ Dados médicos (anamnese) acessíveis apenas por:
  - Responsável do aluno
  - Direção
  - Coordenação
  - Professor da turma
- ✅ Dados financeiros acessíveis por:
  - Responsável (seus pagamentos)
  - Coordenação (suas atividades)
  - Direção (todos)

---

## 📧 Configuração de Email

### Secrets Configurados
- ✅ `GMAIL_EMAIL` - Email do remetente
- ✅ `GMAIL_APP_PASSWORD` - Senha de app do Gmail

### Edge Functions de Email
1. **send-invitation-email**
   - Envia convite para novos admins
   - Template: Link de convite + instruções

2. **send-payment-reminder**
   - Lembrete individual de pagamento
   - Template: Nome aluno, atividade, valor, vencimento

3. **send-notifications**
   - Envio em lote de notificações
   - Lembretes de pagamento (5 dias antes)
   - Alertas de atraso
   - Matrículas pendentes (>3 dias)

---

## 🎨 Design System

### Cores Principais (HSL)
- **Primary**: Vermelho (tema Neo Missio)
- **Secondary**: Cinza neutro
- **Accent**: Verde para ações positivas
- **Muted**: Tons suaves para backgrounds
- **Sidebar**: Fundo escuro para navegação

### Componentes Shadcn/UI
- ✅ Button, Card, Dialog, Form, Input, Select
- ✅ Table, Tabs, Toast, Tooltip, Sheet
- ✅ Alert, Badge, Calendar, Checkbox
- ✅ Dropdown Menu, Avatar, Separator

---

## 🎯 Métricas de Sucesso

### KPIs do Sistema
- Taxa de aprovação de matrículas
- Taxa de inadimplência
- Taxa de presença média
- Número de alunos ativos por atividade
- Receita mensal por atividade
- Custo por aluno
- Margem de lucro operacional

### Objetivos de Uso
- ✅ Reduzir inadimplência através de lembretes automáticos
- ✅ Simplificar processo de matrícula
- ✅ Centralizar informações de alunos e atividades
- ✅ Facilitar gestão financeira
- ✅ Melhorar comunicação com responsáveis
- ✅ Automatizar processos repetitivos

---

## 📝 Próximos Passos Imediatos

1. **Testar todos os fluxos críticos:**
   - Cadastro de novo aluno
   - Solicitação e aprovação de matrícula
   - Registro de pagamento
   - Registro de presença

2. **Configurar Cron Jobs:**
   - Envio automático de notificações diárias
   - Atualização de status de pagamentos

3. **Implementar WhatsApp:**
   - Escolher provider (Evolution API recomendado)
   - Integrar com edge functions

4. **Melhorar Relatórios:**
   - Adicionar mais gráficos
   - Exportação em múltiplos formatos
   - Filtros avançados

5. **Treinar Usuários:**
   - Criar manual de uso por role
   - Vídeos tutoriais
   - Onboarding guiado

---

## 📞 Suporte

Para dúvidas sobre o sistema:
- **WhatsApp**: (41) 98440-6992
- **Email**: Configurado no sistema
- **Endereço**: Rua Camilo Castelo Branco, 523 - Vila Lindóia

---

## 📚 Documentação Adicional

- `docs/fluxo-novo-aluno.md` - Detalhamento do fluxo de matrícula
- `docs/sistema-notificacoes.md` - Sistema de notificações completo
- `docs/notificacoes-automaticas.md` - Configuração de automação

---

**Última atualização:** 2025-12-01
**Versão do Sistema:** 1.0.0
**Status:** ✅ Sistema Principal Operacional
