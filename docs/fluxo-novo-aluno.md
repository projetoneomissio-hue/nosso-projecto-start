# Fluxo do Novo Aluno - Neo Missio

## Passo a Passo: Como um Novo Aluno se Inscreve no Sistema

### 1️⃣ **Landing Page (Primeiro Contato)**
- **URL**: https://seu-dominio.lovable.app
- O responsável acessa a landing page pública do Neo Missio
- Visualiza todas as 11 atividades disponíveis em 2026:
  - Aulas de Desenho (R$ 60/mês)
  - Aulas de Inglês (R$ 60/mês + R$ 100 material)
  - Aulas de Música (R$ 100/mês + R$ 25 apostila)
  - Ballet Infantil (R$ 60/mês)
  - Cordas de Amor (Gratuito)
  - Escuta Terapêutica Cristã (R$ 70/mês)
  - Jiu-Jitsu (R$ 70/mês infantil | R$ 100/mês adulto)
  - Pilates Solo (R$ 100/mês)
  - Reforço Escolar (R$ 50/mês)
  - Vôlei (R$ 60/mês)
  - Aconselhamento para Homens (Gratuito)

### 2️⃣ **Formulário de Pré-Inscrição (Google Forms)**
- No botão "Realizar Inscrição", o responsável é direcionado para:
  - **Link**: https://forms.gle/oKs6ari7ChgxobAQ9
- Preenche o formulário com informações básicas
- **Observação Importante**: Algumas atividades podem estar em lista de espera

### 3️⃣ **Contato via WhatsApp**
- Após preencher o formulário, o responsável deve entrar em contato:
  - **WhatsApp**: (41) 98440-6992
- A equipe do Neo Missio faz o atendimento inicial e esclarece dúvidas
- Fornece instruções para criar conta no sistema

### 4️⃣ **Criação de Conta no Sistema**
- O responsável acessa: **Login > Criar Conta**
- Preenche seus dados pessoais:
  - Nome completo
  - Email
  - Senha
  - Telefone
- A conta é criada automaticamente com perfil de **Responsável**
- Recebe email de confirmação (auto-confirmado em desenvolvimento)

### 5️⃣ **Primeiro Acesso ao Dashboard**
- Após fazer login, o responsável vê o dashboard com:
  - Resumo de alunos cadastrados (inicialmente 0)
  - Atividades disponíveis
  - Opções do menu lateral

### 6️⃣ **Cadastrar Aluno**
- Menu: **Dashboard > Cadastrar Novo Aluno**
- Rota: `/responsavel/cadastrar-aluno`
- Preenche os dados do aluno:
  - Nome completo **(obrigatório)**
  - Data de nascimento **(obrigatório)**
  - CPF (opcional)
  - Telefone (opcional)
  - Endereço (opcional)
- Clica em "Cadastrar Aluno"
- O aluno é vinculado automaticamente ao responsável logado

### 7️⃣ **Solicitar Matrícula em Atividade**
- Menu: **Nova Matrícula**
- Rota: `/responsavel/nova-matricula`
- Passo a passo:
  1. **Selecionar Aluno**: Escolhe qual aluno será matriculado
  2. **Selecionar Atividade**: Visualiza todas as atividades disponíveis
  3. **Visualizar Detalhes**: Vê descrição, valor mensal e horários
  4. **Selecionar Turma**: Escolhe uma turma disponível com vagas
  5. **Solicitar Matrícula**: Envia o pedido de matrícula

- Status inicial: **Pendente** (aguardando aprovação da coordenação)

### 8️⃣ **Aprovação da Matrícula (Coordenação/Direção)**
- A coordenação recebe notificação de nova matrícula pendente
- Menu Coordenação: **Matrículas Pendentes**
- Revisa os dados do aluno e da matrícula
- **Aprova** ou **Rejeita** a matrícula
- Se aprovada, o status muda para: **Ativa**

### 9️⃣ **Geração Automática de Pagamentos**
- Quando a matrícula é aprovada, o sistema automaticamente:
  - Cria os pagamentos mensais
  - Define datas de vencimento
  - Calcula valores baseados na atividade

### 🔟 **Acompanhamento pelo Responsável**
- **Atividades Matriculadas**: Visualiza todas as atividades do aluno
- **Pagamentos**: Acompanha mensalidades e status de pagamento
- **Relatórios do Aluno**: Vê presença e observações dos professores
- **Anamnese**: Preenche formulário de saúde (para atividades esportivas)

---

## 📊 Resumo Visual do Fluxo

```
Landing Page → Google Forms → WhatsApp → Criar Conta → Login
                                                         ↓
                                              Dashboard Responsável
                                                         ↓
                                              Cadastrar Aluno
                                                         ↓
                                              Solicitar Matrícula
                                                         ↓
                                    [Aguarda Aprovação - Status: Pendente]
                                                         ↓
                            Coordenação Aprova → Status: Ativa
                                                         ↓
                                    Pagamentos Gerados Automaticamente
                                                         ↓
                                    Acompanhamento Contínuo pelo Responsável
```

---

## 🔑 Links Importantes

### Para Novos Alunos:
- **Landing Page**: https://seu-dominio.lovable.app
- **Formulário de Pré-Inscrição**: https://forms.gle/oKs6ari7ChgxobAQ9
- **WhatsApp Neo Missio**: https://wa.me/5541984406992
- **Endereço**: Rua Camilo Castelo Branco, 523 - Vila Lindóia

### Para Acesso ao Sistema:
- **Login**: https://seu-dominio.lovable.app/login
- **Criar Conta**: https://seu-dominio.lovable.app/login (opção "Criar conta")

---

## 💡 Dicas para os Responsáveis

1. **Taxa de Matrícula**: Todas as atividades têm uma taxa única de R$ 25,00
2. **Lista de Espera**: Algumas atividades podem estar cheias - entre em contato via WhatsApp
3. **Cadastre Todos os Filhos**: Você pode cadastrar múltiplos alunos na mesma conta
4. **Acompanhe os Pagamentos**: Evite atrasos para garantir a continuidade das atividades
5. **Preencha a Anamnese**: Essencial para atividades esportivas (informações de saúde)

---

## 📞 Suporte e Dúvidas

**WhatsApp**: (41) 98440-6992  
**Email**: Disponível no perfil da coordenação  
**Horário de Atendimento**: Conforme calendário das atividades
