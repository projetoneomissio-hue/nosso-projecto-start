-- Tabela para armazenar códigos de recuperação MFA
CREATE TABLE IF NOT EXISTS public.mfa_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);

-- Índice para buscar códigos por usuário
CREATE INDEX idx_mfa_recovery_codes_user_id ON public.mfa_recovery_codes(user_id);

-- Enable RLS
ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seus próprios códigos
CREATE POLICY "Usuários podem ver seus próprios códigos de recuperação"
ON public.mfa_recovery_codes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política: usuários podem criar seus próprios códigos durante setup MFA
CREATE POLICY "Usuários podem criar seus próprios códigos"
ON public.mfa_recovery_codes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem marcar seus códigos como usados
CREATE POLICY "Usuários podem atualizar seus códigos"
ON public.mfa_recovery_codes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Função para validar código de recuperação
CREATE OR REPLACE FUNCTION public.validate_recovery_code(
  _user_id UUID,
  _code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_exists BOOLEAN;
BEGIN
  -- Verifica se o código existe e não foi usado
  SELECT EXISTS(
    SELECT 1 
    FROM public.mfa_recovery_codes 
    WHERE user_id = _user_id 
      AND code = _code 
      AND used_at IS NULL
  ) INTO code_exists;
  
  -- Se o código é válido, marca como usado
  IF code_exists THEN
    UPDATE public.mfa_recovery_codes
    SET used_at = now()
    WHERE user_id = _user_id AND code = _code;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;