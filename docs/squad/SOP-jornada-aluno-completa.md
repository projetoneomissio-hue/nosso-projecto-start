# SOP — Jornada Completa do Aluno
## Do Interesse à Matrícula Ativa

> Versão: 1.0 | Data: 2026-06-08
> Sistema: sistema.neomissio.com.br

---

## Visão Geral

```
INTERESSADO → LEAD → FICHA COMPLETA → CONVERTIDO → RESPONSÁVEL ATIVO → MATRÍCULA ATIVA → PAGAMENTO OK
```

---

## ETAPA 1 — A Pessoa Descobre e se Interessa

**Quem faz:** O futuro aluno ou responsável, sozinho, sem ajuda da equipe.

**Como chega até a Neo Missio:**
- Instagram / Facebook
- Indicação de amigo
- Na escola / boca a boca
- Link direto compartilhado pela equipe

**O que acontece:**
1. A pessoa acessa o site público: `sistema.neomissio.com.br`
2. Vê as atividades disponíveis com horários e preços
3. Clica em **"Quero me Inscrever"** na atividade desejada
4. É redirecionada para o formulário de matrícula online

**Sistema:** nenhuma ação necessária da equipe ainda.

---

## ETAPA 2 — Passo 1 do Formulário (Lead Inicial)

**Quem faz:** O interessado, sozinho.
**Onde:** `sistema.neomissio.com.br/matricula/[nome-da-unidade]`

**Primeira tela — "Quem vai participar?"**

O sistema pergunta:
- **Meu filho(a)** → para pais inscrevendo crianças
- **Eu mesmo** → para adultos se inscrevendo

**Formulário Passo 1 (modo filho):**
- Nome da criança + sobrenome
- Data de nascimento da criança
- WhatsApp do pai/mãe ← **o mais importante para contato**

**Formulário Passo 1 (modo eu mesmo):**
- Nome + sobrenome
- Data de nascimento
- WhatsApp + E-mail

**O que acontece no sistema:**
- Lead criado com status **PASSO 1**
- Aparece imediatamente em `/direcao/interessados`
- A equipe já pode ver e entrar em contato

> ✅ **Ponto crítico:** Mesmo que o interessado abandone o formulário aqui, a equipe já tem o WhatsApp para ligar.

---

## ETAPA 3 — Passo 2 do Formulário (Ficha Completa)

**Quem faz:** O interessado, continuando o formulário.

**Formulário Passo 2 (modo filho):**
- Nome completo do pai/mãe
- E-mail do pai/mãe ← necessário para enviar o convite
- CPF do responsável
- Escola da criança + série/ano
- Necessidades especiais (opcional)
- Como conheceu a Neo Missio
- ☐ Autorizo o uso de fotos e vídeos no Instagram, Facebook e materiais da Neo Missio

**Formulário Passo 2 (modo eu mesmo):**
- Necessidades especiais (opcional)
- Como conheceu a Neo Missio
- ☐ Autorizo o uso de fotos e vídeos

**O que acontece no sistema:**
- Status muda para **FICHA COMPLETA**
- Equipe vê o badge amarelo na lista de Interessados

**Mensagem exibida para o interessado:**
> "Muito obrigado! A equipe da Neo Missio recebeu seus dados e entrará em contato pelo WhatsApp em breve."

---

## ETAPA 4 — Ação da Equipe: Primeiro Contato (48h)

**Quem faz:** Coordenação ou Secretaria
**Onde:** `/direcao/interessados`
**Prazo:** até 48 horas após o lead chegar

**O que ver na tela:**
- Badge **PASSO 1** = lead incompleto, só tem WhatsApp
- Badge **FICHA COMPLETA** = tem todos os dados, pronto para converter
- Badge **CONVERTIDO** = já processado, nada a fazer
- Badge **REJEITADO** = não aparece na lista padrão

**Ação para PASSO 1 (incompleto):**
1. Clique no botão verde de WhatsApp na linha do lead
2. Mensagem sugerida automática pelo sistema
3. Objetivo da ligação/mensagem: confirmar interesse e pedir para completar o formulário OU coletar os dados por telefone
4. Se coletou os dados por telefone: clique `···` → **Completar Ficha** → preencha escola, série, CPF
5. Se não tem interesse / não atende após 3 tentativas: clique `···` → **Arquivar**

**Ação para FICHA COMPLETA:**
1. Ligar/WhatsApp para confirmar o interesse e agendar horário de visita ou confirmar vaga
2. Se confirmado: avançar para Etapa 5 (Converter)
3. Se desistiu: clique `···` → **Arquivar**

---

## ETAPA 5 — Converter em Aluno

**Quem faz:** Coordenação ou Direção
**Onde:** `/direcao/interessados` → linha com **FICHA COMPLETA**
**Ação:** clique `···` → **Converter Aluno**

**O que preencher no dialog:**
- **Nome do Pai/Mãe:** nome completo do responsável
- **E-mail para Convite:** e-mail onde vai chegar o acesso ao sistema
- **Isentar Taxa de Matrícula:** marcar APENAS em casos especiais (bolsa integral, transferência de outro projeto)

**Clique "Confirmar Conversão".**

**O que o sistema faz automaticamente:**
1. Cria o cadastro do aluno no banco de dados
2. Cria a matrícula com status **pendente**
3. Gera a taxa de matrícula (R$ 25,00) com vencimento em 3 dias
4. Cria um convite com link seguro para o responsável
5. Envia e-mail de convite para o responsável
6. Exibe um link de pagamento PIX/cartão para você copiar e mandar no WhatsApp

**Após a conversão:**
- O lead some dos Interessados (status = CONVERTIDO)
- O aluno aparece em `/alunos`
- Copie o link de pagamento e mande no WhatsApp do responsável

---

## ETAPA 6 — Responsável Recebe o Convite e Cria a Conta

**Quem faz:** O responsável (pai/mãe ou o próprio aluno adulto)
**Onde:** E-mail recebido → link para `sistema.neomissio.com.br/resgatar-convite`

**O que o responsável faz:**
1. Clica no link do e-mail
2. Digita o token (código de 8 letras) + e-mail
3. Cria uma senha segura (mínimo 6 caracteres)
4. Clica **Concluir Cadastro**
5. É redirecionado para o login

**O que o sistema faz:**
- Cria a conta com role "Responsável"
- Vincula automaticamente os alunos à conta
- Garante acesso ao portal do responsável

> ⚠️ **Problema comum:** O e-mail vai para o spam. Orientar o responsável a verificar a pasta de spam se não receber em 5 minutos.

---

## ETAPA 7 — Responsável Acessa o Sistema e Paga

**Quem faz:** O responsável
**Onde:** `sistema.neomissio.com.br` → Login → Portal do Responsável

**Dashboard do Responsável mostra:**
- Alunos vinculados
- Atividades matriculadas
- Pagamentos pendentes

**Para pagar a taxa de matrícula (R$ 25,00):**
1. Acessa `/responsavel/pagamentos`
2. Vê a cobrança pendente
3. Clica **Pagar Online** → PIX ou cartão via InfinitePay
4. Realiza o pagamento
5. Sistema confirma automaticamente (webhook)

**Alternativa — pagamento presencial:**
1. Responsável acessa `/responsavel/registrar-pagamento`
2. Seleciona o pagamento e informa a forma (dinheiro, PIX manual, etc.)
3. Status vai para **Aguardando Confirmação**
4. Equipe confirma manualmente em `/direcao/cobrancas`

---

## ETAPA 8 — Responsável Faz a Matrícula na Atividade

**Quem faz:** O responsável (ou a secretaria faz por ele)
**Onde:** `/responsavel/nova-matricula`

**Passos:**
1. Seleciona o aluno
2. Seleciona a atividade desejada
3. Seleciona a turma/horário disponível
4. Clica **Solicitar Matrícula**

**Sistema:**
- Matrícula criada com status **pendente**
- E-mail de confirmação enviado ao responsável
- Equipe recebe notificação

**Equipe aprova a matrícula:**
1. Acessa `/direcao/matriculas`
2. Localiza a matrícula pendente
3. Aprova → status muda para **ativa**

---

## ETAPA 9 — Aluno Ativo no Sistema ✅

**O que fica disponível:**

**Para o Professor:**
- Aluno aparece na lista de chamada da turma
- Pode lançar frequência e notas

**Para a Coordenação:**
- Aluno visível no dashboard de turmas
- Pode acompanhar presença e desempenho

**Para a Direção:**
- Aluno visível em Alunos, Matrículas, Cobranças
- Pagamentos mensais gerados automaticamente todo dia 5

**Para o Responsável:**
- Acessa o portal e vê: atividades do aluno, pagamentos, comunicados

---

## Resumo das Ações por Status

| Status na Tela | Significado | Ação da Equipe |
|---|---|---|
| 🔵 PASSO 1 | Só tem WhatsApp | Ligar e pedir ficha completa |
| 🟡 FICHA COMPLETA | Tem todos os dados | Confirmar interesse → Converter |
| 🟢 CONVERTIDO | Aluno criado, convite enviado | Mandar link de pagamento no WhatsApp |
| 🔴 ARQUIVADO | Desistiu ou sem resposta | Não aparece na lista padrão |

---

## Prazos Recomendados

| Etapa | Prazo Máximo |
|---|---|
| Primeiro contato após lead chegar | 2 horas (durante horário comercial) |
| Converter após confirmar interesse | No mesmo dia |
| Cobrar pagamento da taxa | 3 dias após conversão |
| Aprovar matrícula após solicitação | 24 horas |

---

## Casos Especiais

### Responsável não recebeu o e-mail de convite
1. Verificar pasta de spam
2. Se não encontrar: Direção acessa `/convites` e reenvia o convite

### Responsável quer pagar presencialmente
1. Aceite o pagamento em dinheiro/PIX
2. Acesse `/direcao/cobrancas`
3. Localize o pagamento da taxa de matrícula do aluno
4. Marque como pago manualmente

### Aluno já era cadastrado (voltou após pausa)
1. Na tela de conversão, o sistema detecta automaticamente pelo CPF ou e-mail
2. Não cria duplicata — usa o cadastro existente
3. Marcar "Isentar Taxa de Matrícula" se já pagou antes

### Lead duplicado na lista
1. Identificar qual tem mais dados (FICHA COMPLETA > PASSO 1)
2. Converter o mais completo
3. Deletar o duplicado: `···` → **Deletar**

---

## Contatos e Suporte

- Dúvidas sobre o sistema: equipe técnica NeoMissio
- Problemas com pagamento: InfinitePay (gateway de pagamento)
- Problemas com e-mail de convite: verificar spam → reenviar pelo sistema
