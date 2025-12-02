/**
 * SECURITY NOTE: Login and Signup Flow
 * =====================================
 * 
 * PUBLIC SIGNUP RESTRICTION:
 * - Only 'responsavel' role is allowed for public signup
 * - Admin roles (direcao, coordenacao, professor) MUST use invitation tokens
 * 
 * INVITATION-BASED REGISTRATION:
 * - Admin users must be invited by 'direcao' role
 * - Invitation tokens are validated server-side before role assignment
 * - Tokens expire and can only be used once
 * 
 * CLIENT-SIDE CHECKS ARE FOR UX ONLY:
 * - All authorization is enforced at database level via RLS policies
 * - Never trust client-side role checks for security decisions
 * - See src/components/ProtectedRoute.tsx and src/hooks/useUserRole.tsx
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255, { message: "Email muito longo" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100, { message: "Senha muito longa" }),
});

// Public signup schema - ONLY allows 'responsavel' role
const signupSchema = z.object({
  name: z.string().trim().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }).max(100, { message: "Nome muito longo" }),
  email: z.string().trim().email({ message: "Email inválido" }).max(255, { message: "Email muito longo" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100, { message: "Senha muito longa" }),
});

// Invitation-based signup schema for admin roles
const inviteSignupSchema = z.object({
  name: z.string().trim().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }).max(100, { message: "Nome muito longo" }),
  email: z.string().trim().email({ message: "Email inválido" }).max(255, { message: "Email muito longo" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100, { message: "Senha muito longa" }),
  inviteToken: z.string().min(1, { message: "Token de convite é obrigatório" }),
});

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [hasInvite, setHasInvite] = useState(false);
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    
    const { error } = await login(validation.data.email, validation.data.password);
    
    if (error) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Check if user needs to verify MFA
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check if user has MFA enabled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      
      if (factors && factors.totp && factors.totp.length > 0) {
        // User has MFA enabled, create challenge and redirect
        const factor = factors.totp[0];
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: factor.id
        });

        if (challengeError) {
          toast({
            title: "Erro MFA",
            description: challengeError.message,
            variant: "destructive",
          });
          return;
        }

        navigate("/mfa-verify", { 
          state: { 
            factorId: factor.id,
            challengeId: challengeData.id 
          } 
        });
        return;
      }

      // Check if user is admin and doesn't have MFA set up
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = roles?.some(r => 
        ['direcao', 'coordenacao', 'professor'].includes(r.role)
      );

      if (isAdmin) {
        // Admin without MFA - redirect to setup
        toast({
          title: "Configuração MFA Necessária",
          description: "Como administrador, você precisa configurar a autenticação de dois fatores.",
        });
        navigate("/mfa-setup");
        return;
      }
    }

    navigate("/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate based on whether user has an invitation
    if (hasInvite) {
      const validation = inviteSignupSchema.safeParse({ name, email, password, inviteToken });
      
      if (!validation.success) {
        toast({
          title: "Erro de validação",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      try {
        // Validate invitation token first
        const { data: invitation, error: inviteError } = await supabase
          .from("invitations")
          .select("role, email")
          .eq("token", validation.data.inviteToken)
          .is("used_at", null)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (inviteError || !invitation) {
          toast({
            title: "Convite inválido",
            description: "O token de convite é inválido ou expirou",
            variant: "destructive",
          });
          return;
        }

        if (invitation.email.toLowerCase() !== validation.data.email.toLowerCase()) {
          toast({
            title: "Email incorreto",
            description: "Este convite foi enviado para outro email",
            variant: "destructive",
          });
          return;
        }

        // Create account with invited role
        const { error } = await signup(
          validation.data.email,
          validation.data.password,
          validation.data.name,
          invitation.role
        );

        if (error) {
          toast({
            title: "Erro ao criar conta",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Conta criada!",
            description: "Faça login para acessar o sistema.",
          });
          setHasInvite(false);
          setInviteToken("");
          setEmail("");
          setPassword("");
          setName("");
        }
      } catch (error) {
        toast({
          title: "Erro ao validar convite",
          description: "Não foi possível validar o convite. Tente novamente.",
          variant: "destructive",
        });
      }
    } else {
      // Public signup - only allows 'responsavel' role
      const validation = signupSchema.safeParse({ name, email, password });
      
      if (!validation.success) {
        toast({
          title: "Erro de validação",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await signup(
        validation.data.email, 
        validation.data.password, 
        validation.data.name, 
        "responsavel" // SECURITY: Public signup restricted to 'responsavel' role only
      );
      
      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: "Faça login para cadastrar seus alunos e solicitar matrículas.",
        });
        setEmail("");
        setPassword("");
        setName("");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Neo Missio</CardTitle>
          <CardDescription>Sistema de Gestão</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-sm text-muted-foreground">
                    {hasInvite ? "Cadastro com Convite (Admin)" : "Cadastro Público (Responsável)"}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setHasInvite(!hasInvite)}
                  >
                    {hasInvite ? "Cadastro sem convite" : "Tenho um convite"}
                  </Button>
                </div>

                {hasInvite && (
                  <div className="space-y-2">
                    <Label htmlFor="invite-token">Token de Convite</Label>
                    <Input
                      id="invite-token"
                      type="text"
                      placeholder="Cole o token do seu convite"
                      value={inviteToken}
                      onChange={(e) => setInviteToken(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Token enviado por email pela direção
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Digite seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {!hasInvite && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-warning" />
                      <p className="text-sm font-semibold">Cadastro como Responsável</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cadastros públicos são criados automaticamente como Responsável. 
                      Para acesso administrativo, solicite um convite à direção.
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full">
                  {hasInvite ? "Criar Conta com Convite" : "Criar Conta"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setHasInvite(false)}
                >
                  Já tem uma conta? Faça login
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
