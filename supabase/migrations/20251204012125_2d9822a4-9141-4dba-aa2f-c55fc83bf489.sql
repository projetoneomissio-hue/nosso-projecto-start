-- Atualizar o trigger para criar profile E user_role automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _role app_role;
  _invite_token text;
BEGIN
  -- Criar profile
  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Novo Usuário'),
    NEW.email
  );
  
  -- Verificar se há token de convite
  _invite_token := NEW.raw_user_meta_data->>'invite_token';
  
  IF _invite_token IS NOT NULL AND _invite_token != '' THEN
    -- Validar convite e obter role
    BEGIN
      SELECT role INTO _role
      FROM public.invitations
      WHERE token = _invite_token
        AND email = NEW.email
        AND used_at IS NULL
        AND expires_at > now();
      
      IF _role IS NOT NULL THEN
        -- Marcar convite como usado
        UPDATE public.invitations
        SET used_at = now()
        WHERE token = _invite_token AND email = NEW.email;
        
        -- Criar role do convite
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, _role);
        
        RETURN NEW;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Se falhar, continua para criar role responsavel
      NULL;
    END;
  END IF;
  
  -- Criar role padrão (responsavel) para cadastros públicos
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'responsavel');
  
  RETURN NEW;
END;
$$;

-- Corrigir usuários existentes sem role (adicionar como responsavel)
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'responsavel'::app_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.id IS NULL;