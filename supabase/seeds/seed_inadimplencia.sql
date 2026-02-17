-- ALUNO TESTE E INADIMPLÊNCIA

DO $$
DECLARE
  v_responsavel_id UUID;
  v_aluno_id UUID;
  v_turma_id UUID;
  v_matricula_id UUID;
BEGIN

  -- 1. Cria Responsável (se não existir, senão pega o primeiro)
  -- Tenta pegar um admin existente ou cria um novo perfi
  SELECT id INTO v_responsavel_id FROM profiles WHERE email = 'responsavel_teste@neomissio.com';
  
  IF v_responsavel_id IS NULL THEN
     -- SOLUÇÃO: Pega o PRIMEIRO usuário real existente no sistema (você!)
     SELECT id INTO v_responsavel_id FROM auth.users LIMIT 1;

     IF v_responsavel_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum usuário encontrado. Crie uma conta no sistema (Sign Up) primeiro.';
     END IF;
     
     -- Garante que o perfil existe (se não existir, cria)
     INSERT INTO public.profiles (id, nome_completo, email, telefone)
     VALUES (v_responsavel_id, 'Responsável Teste (Seu Usuário)', 'seu_email@teste.com', '11999999999')
     ON CONFLICT (id) DO NOTHING;
     
     -- Garante a role de responsável
     INSERT INTO public.user_roles (user_id, role)
     VALUES (v_responsavel_id, 'responsavel')
     ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- 2. Cria Aluno vinculado a você
  INSERT INTO public.alunos (nome_completo, data_nascimento, responsavel_id)
  VALUES ('Aluno Devedor Teste', '2015-05-15', v_responsavel_id)
  RETURNING id INTO v_aluno_id;

  -- 5. Cria Atividade e Turma
  SELECT id INTO v_turma_id FROM public.turmas LIMIT 1;
  
  IF v_turma_id IS NULL THEN
    -- Precisa de uma atividade primeiro
    INSERT INTO public.atividades (nome, valor_mensal, ativa)
    VALUES ('Atividade Teste', 350.00, true)
    RETURNING id INTO v_turma_id; -- Reusing variable temporarily to store atividade_id
    
    INSERT INTO public.turmas (atividade_id, nome, capacidade_maxima, horario, dias_semana)
    VALUES (v_turma_id, 'Turma Teste Manhã', 20, '08:00', ARRAY['seg', 'qua'])
    RETURNING id INTO v_turma_id;
  END IF;

  -- 4. Cria Matrícula
  INSERT INTO public.matriculas (aluno_id, turma_id, data_inicio, status, valor_mensal, dia_vencimento)
  VALUES (v_aluno_id, v_turma_id, CURRENT_DATE - INTERVAL '2 months', 'ativa', 350.00, 10)
  RETURNING id INTO v_matricula_id;

  -- 5. Cria Pagamento Atrasado (Vencimento mês passado)
  INSERT INTO public.pagamentos (matricula_id, valor, data_vencimento, status, metodo_pagamento)
  VALUES (v_matricula_id, 350.00, CURRENT_DATE - INTERVAL '5 days', 'pendente', 'boleto');

END $$;
