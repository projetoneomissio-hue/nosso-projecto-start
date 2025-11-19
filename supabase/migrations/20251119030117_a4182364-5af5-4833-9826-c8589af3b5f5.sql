-- Create invitations table for admin role registration
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role app_role NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Only 'direcao' can create invitations
CREATE POLICY "Direção pode criar convites"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'direcao'::app_role));

-- Only 'direcao' can view invitations
CREATE POLICY "Direção pode ver convites"
ON public.invitations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'direcao'::app_role));

-- Only 'direcao' can delete invitations
CREATE POLICY "Direção pode deletar convites"
ON public.invitations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'direcao'::app_role));

-- Unauthenticated users can read their own invitation by token (for signup validation)
CREATE POLICY "Usuários não autenticados podem validar tokens"
ON public.invitations
FOR SELECT
TO anon
USING (used_at IS NULL AND expires_at > now());

-- Update user_roles policies to prevent self-assignment of privileged roles
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;

CREATE POLICY "Usuários podem criar role responsavel no signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'responsavel'::app_role
);

-- Allow invitation-based role assignment for all roles
CREATE POLICY "Sistema pode atribuir roles via convite"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.invitations
    WHERE invitations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND invitations.role = user_roles.role
    AND invitations.used_at IS NULL
    AND invitations.expires_at > now()
  )
);

-- Create trigger to update invitations.updated_at
CREATE TRIGGER update_invitations_updated_at
BEFORE UPDATE ON public.invitations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create function to validate and consume invitation token
CREATE OR REPLACE FUNCTION public.validate_invitation_token(
  _token TEXT,
  _email TEXT
)
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  -- Get and mark invitation as used
  UPDATE public.invitations
  SET used_at = now()
  WHERE token = _token
    AND email = _email
    AND used_at IS NULL
    AND expires_at > now()
  RETURNING role INTO _role;
  
  IF _role IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  RETURN _role;
END;
$$;