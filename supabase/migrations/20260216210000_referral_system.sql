-- Adicionar código de indicação e quem convidou na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS codigo_indicacao TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS convidado_por UUID REFERENCES profiles(id);

-- Adicionar origem do cadastro na tabela de alunos para rastreamento (UTMs)
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS origem_cadastro JSONB DEFAULT '{}'::jsonb;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_profiles_codigo_indicacao ON profiles(codigo_indicacao);

-- Função para gerar código aleatório simples
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função Trigger para preencher dados de referral na criação do perfil
CREATE OR REPLACE FUNCTION handle_new_user_referral()
RETURNS TRIGGER AS $$
DECLARE
  referrer_code TEXT;
  referrer_id UUID;
  user_meta JSONB;
BEGIN
  -- Gerar código de indicação se não existir
  IF NEW.codigo_indicacao IS NULL THEN
    LOOP
      NEW.codigo_indicacao := generate_referral_code();
      BEGIN
        EXIT; -- Se sucesso (único), sai do loop. Se falhar na constraint UNIQUE, repete.
      EXCEPTION WHEN unique_violation THEN
        -- Tenta novamente
      END;
      EXIT WHEN NEW.codigo_indicacao IS NOT NULL; 
    END LOOP;
  END IF;

  -- Buscar metadados do usuário em auth.users para ver se tem 'referral_code'
  -- Nota: Isso assume que o profile é criado logo após o user. 
  -- Se o profile for criado via trigger do auth.users, precisamos pegar os dados do auth.users.
  -- Como estamos no trigger da tabela profiles, podemos consultar auth.users.
  
  SELECT raw_user_meta_data INTO user_meta
  FROM auth.users
  WHERE id = NEW.id;

  referrer_code := user_meta->>'referral_code';

  IF referrer_code IS NOT NULL THEN
    SELECT id INTO referrer_id FROM profiles WHERE codigo_indicacao = referrer_code;
    IF referrer_id IS NOT NULL THEN
      NEW.convidado_por := referrer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger (Antes de inserir no profile)
DROP TRIGGER IF EXISTS trigger_handle_referral ON profiles;
CREATE TRIGGER trigger_handle_referral
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION handle_new_user_referral();
