# Fluxo do Novo Aluno - Neo Missio

## Passo a Passo: Como um Novo Aluno se Inscreve no Sistema

### 1️⃣ **Landing Page (Primeiro Contato)**
- **URL**: `/` (página inicial)
- O responsável acessa a landing page pública do Neo Missio
- Visualiza todas as atividades disponíveis com preços e horários
- Clica em "Acessar Sistema" ou "Criar Conta"

### 2️⃣ **Criação de Conta no Sistema**
- **Rota**: `/login` → Aba "Cadastro"
- O responsável preenche seus dados:
  - Nome completo **(obrigatório)**
  - Email **(obrigatório)**
  - Senha **(obrigatório, mínimo 6 caracteres)**
- **Importante**: Cadastros públicos são criados automaticamente como **Responsável**
- Após criar conta, fazer login na aba "Login"

### 3️⃣ **Dashboard do Responsável**
- **Rota**: `/responsavel/dashboard`
- Após fazer login, o responsável é redirecionado para seu dashboard personalizado
- Visualiza:
  - Cards de resumo: alunos cadastrados, matrículas ativas/pendentes, pagamentos
  - Lista de alunos cadastrados (inicialmente vazia)
  - Lista de matrículas recentes
  - Próximos pagamentos pendentes
- **Se nenhum aluno**: Card destacado orientando cadastrar primeiro aluno

### 4️⃣ **Cadastrar Aluno**
- **Rota**: `/responsavel/cadastrar-aluno`
- Menu lateral: **Cadastrar Aluno**
- Preenche os dados do aluno:
  - Nome completo **(obrigatório)**
  - Data de nascimento **(obrigatório)**
  - CPF (opcional)
  - Telefone (opcional)
  - Endereço (opcional)
- Clica em "Cadastrar Aluno"
- O aluno é vinculado automaticamente ao responsável logado
- **Após cadastro**: Redirecionado para Nova Matrícula

### 5️⃣ **Solicitar Matrícula em Atividade**
- **Rota**: `/responsavel/nova-matricula`
- Menu lateral: **Nova Matrícula**
- Passo a passo:
  1. **Selecionar Aluno**: Escolhe qual aluno será matriculado
  2. **Selecionar Atividade**: Visualiza todas as atividades ativas com valores
  3. **Selecionar Turma/Horário**: Escolhe uma turma disponível com vagas
  4. **Solicitar Matrícula**: Envia o pedido de matrícula
- Status inicial: **Pendente** (aguardando aprovação)

### 6️⃣ **Aprovação da Matrícula (Coordenação/Direção)**
- **Rota**: `/coordenacao/matriculas-pendentes`
- **Quem pode aprovar**: Coordenação e Direção
- Coordenador/Diretor visualiza matrículas pendentes
- Revisa os dados do aluno e da matrícula
- **Aprova** ou **Rejeita** a matrícula
- **Se aprovada**:
  - Status muda para: **Ativa**
  - **12 pagamentos mensais são gerados automaticamente**

### 7️⃣ **Visualização de Pagamentos**
- **Rota**: `/responsavel/pagamentos`
- Menu lateral: **Pagamentos**
- O responsável visualiza:
  - Resumo financeiro (total pendente, total pago)
  - Lista de todos os pagamentos
  - Status e data de vencimento de cada pagamento

### 8️⃣ **Registrar Pagamento**
- **Rota**: `/responsavel/registrar-pagamento`
- Menu lateral: **Registrar Pagamento**
- Seleciona um pagamento pendente
- Escolhe forma de pagamento:
  - PIX
  - Dinheiro
  - Cartão (Crédito/Débito)
  - Boleto
  - Transferência Bancária
- Adiciona observações (opcional)
- Confirma o pagamento
- Status alterado para: **Pago**

### 9️⃣ **Preencher Anamnese (Se Necessário)**
- **Rota**: `/responsavel/anamnese`
- Menu lateral: **Anamnese**
- **Obrigatório para atividades esportivas**: Jiu-Jitsu, Ballet, Vôlei, Pilates
- Informações coletadas:
  - Tipo sanguíneo
  - Alergias
  - Condições médicas
  - Medicamentos em uso
  - Contato de emergência (nome, telefone, relação)
  - Observações adicionais

### 🔟 **Acompanhamento Contínuo**
- **Atividades Matriculadas** (`/responsavel/atividades-matriculadas`): Visualiza todas as atividades do aluno
- **Relatórios do Aluno** (`/responsavel/relatorios-aluno`): Vê presença e observações dos professores
- **Dashboard** (`/responsavel/dashboard`): Visão geral de tudo

---

## 📊 Resumo Visual do Fluxo

```
Landing Page (/) → Login/Cadastro (/login)
                           ↓
              Dashboard Responsável (/responsavel/dashboard)
                           ↓
              Cadastrar Aluno (/responsavel/cadastrar-aluno)
                           ↓
              Solicitar Matrícula (/responsavel/nova-matricula)
                           ↓
              [Aguarda Aprovação - Status: Pendente]
                           ↓
              Coordenação/Direção Aprova (/coordenacao/matriculas-pendentes)
                           ↓
              Status: Ativa + 12 Pagamentos Gerados
                           ↓
              Registrar Pagamentos + Preencher Anamnese
                           ↓
              Aluno Totalmente Ativo!
```

---

## 📋 Rotas do Responsável

| Função | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/responsavel/dashboard` | Visão geral com resumos |
| Cadastrar Aluno | `/responsavel/cadastrar-aluno` | Adicionar novo aluno |
| Nova Matrícula | `/responsavel/nova-matricula` | Solicitar matrícula |
| Atividades Matriculadas | `/responsavel/atividades-matriculadas` | Ver atividades ativas |
| Pagamentos | `/responsavel/pagamentos` | Histórico de pagamentos |
| Registrar Pagamento | `/responsavel/registrar-pagamento` | Registrar pagamento feito |
| Relatórios do Aluno | `/responsavel/relatorios-aluno` | Ver presença e observações |
| Anamnese | `/responsavel/anamnese` | Formulário de saúde |

---

## 🔑 Validações de Segurança

1. **RLS (Row Level Security)**: Responsáveis só veem dados de seus próprios alunos
2. **Cadastro público**: Limitado ao role `responsavel`
3. **Convites**: Roles administrativos (direcao, coordenacao, professor) requerem token de convite
4. **CPF Mascarado**: Dados sensíveis são mascarados para roles não-direção

---

## 💡 Dicas para os Responsáveis

1. **Cadastre o aluno primeiro**: É necessário ter pelo menos um aluno cadastrado para solicitar matrícula
2. **Cadastre múltiplos filhos**: Você pode cadastrar quantos alunos quiser na mesma conta
3. **Acompanhe os pagamentos**: Evite atrasos para garantir a continuidade das atividades
4. **Preencha a anamnese**: Essencial para atividades esportivas (informações de saúde)
5. **Aguarde aprovação**: Matrículas precisam ser aprovadas pela coordenação antes de ficarem ativas

---

## 📞 Suporte e Dúvidas

**WhatsApp**: (41) 98440-6992  
**Endereço**: Rua Camilo Castelo Branco, 523 - Vila Lindóia
