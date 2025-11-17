import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Building2, UserCircle, GraduationCap, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSignup, setIsSignup] = useState(false);
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const roles = [
    { value: "direcao" as UserRole, label: "Direção", icon: Building2, color: "bg-primary" },
    { value: "coordenacao" as UserRole, label: "Coordenação", icon: UserCircle, color: "bg-success" },
    { value: "professor" as UserRole, label: "Professor", icon: GraduationCap, color: "bg-info" },
    { value: "responsavel" as UserRole, label: "Responsável", icon: Users, color: "bg-warning" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await login(email, password);
    
    if (error) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast({
        title: "Selecione um perfil",
        description: "Por favor, selecione seu perfil de acesso",
        variant: "destructive",
      });
      return;
    }
    
    const { error } = await signup(email, password, name, selectedRole);
    
    if (error) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Conta criada!",
        description: "Você já pode fazer login",
      });
      setIsSignup(false);
      setSelectedRole(null);
      setEmail("");
      setPassword("");
      setName("");
    }
  };

  if (isSignup && !selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Neo Missio</CardTitle>
            <CardDescription>Selecione seu perfil de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <Button
                    key={role.value}
                    variant="outline"
                    className="h-32 flex flex-col gap-3 hover:border-primary"
                    onClick={() => setSelectedRole(role.value)}
                  >
                    <div className={`p-3 rounded-full ${role.color} bg-opacity-10`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <span className="text-lg font-semibold">{role.label}</span>
                  </Button>
                );
              })}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full" onClick={() => {
                setIsSignup(false);
                setSelectedRole(null);
              }}>
                Voltar para Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentRole = selectedRole ? roles.find((r) => r.value === selectedRole) : null;
  const Icon = currentRole?.icon || Users;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {currentRole && (
            <div className="mx-auto mb-4">
              <div className={`inline-block p-4 rounded-full ${currentRole?.color} bg-opacity-10`}>
                <Icon className="h-12 w-12" />
              </div>
            </div>
          )}
          <CardTitle className="text-2xl">
            {currentRole ? `${isSignup ? 'Cadastro' : 'Login'} - ${currentRole.label}` : 'Neo Missio'}
          </CardTitle>
          <CardDescription>
            {currentRole ? (isSignup ? 'Crie sua conta' : 'Entre com suas credenciais') : 'Sistema de Gestão'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isSignup ? "signup" : "login"} onValueChange={(v) => setIsSignup(v === "signup")}>
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
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome completo"
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
                    placeholder="seu@email.com"
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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perfil de Acesso</Label>
                  {selectedRole ? (
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span>{currentRole?.label}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRole(null)}
                      >
                        Alterar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedRole(null)}
                    >
                      Selecionar Perfil
                    </Button>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={!selectedRole}>
                  Criar Conta
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
