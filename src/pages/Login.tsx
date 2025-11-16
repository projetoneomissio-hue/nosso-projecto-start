import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Building2, UserCircle, GraduationCap, Users } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { value: "direcao" as UserRole, label: "Direção", icon: Building2, color: "bg-primary" },
    { value: "coordenacao" as UserRole, label: "Coordenação", icon: UserCircle, color: "bg-success" },
    { value: "professor" as UserRole, label: "Professor", icon: GraduationCap, color: "bg-info" },
    { value: "responsavel" as UserRole, label: "Responsável", icon: Users, color: "bg-warning" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    await login(email, password, selectedRole);
    navigate("/");
  };

  if (!selectedRole) {
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
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentRole = roles.find((r) => r.value === selectedRole);
  const Icon = currentRole?.icon || Users;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className={`inline-block p-4 rounded-full ${currentRole?.color} bg-opacity-10`}>
              <Icon className="h-12 w-12" />
            </div>
          </div>
          <CardTitle className="text-2xl">Login - {currentRole?.label}</CardTitle>
          <CardDescription>Entre com suas credenciais</CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setSelectedRole(null)}>
                Voltar
              </Button>
              <Button type="submit" className="flex-1">
                Entrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
