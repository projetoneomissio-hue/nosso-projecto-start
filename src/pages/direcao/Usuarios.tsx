import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const userSchema = z.object({
  name: z.string().trim().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }).max(100, { message: "Nome muito longo" }),
  email: z.string().trim().email({ message: "Email inválido" }).max(255, { message: "Email muito longo" }),
  role: z.enum(["direcao", "coordenacao", "professor", "responsavel"], { message: "Selecione um perfil válido" }),
});

const mockUsers = [
  { id: 1, name: "João Silva", email: "joao@neomissio.org", role: "coordenacao", status: "ativo" },
  { id: 2, name: "Maria Santos", email: "maria@neomissio.org", role: "professor", status: "ativo" },
  { id: 3, name: "Pedro Costa", email: "pedro@neomissio.org", role: "professor", status: "ativo" },
];


const Usuarios = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = userSchema.safeParse(formData);
    
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Usuário criado!",
      description: "Convite enviado por email",
    });
    
    setFormData({ name: "", email: "", role: "" });
    setOpen(false);
  };
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
            <p className="text-muted-foreground mt-1">
              Controle de acesso e permissões
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário ao sistema
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Perfil</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direcao">Direção</SelectItem>
                      <SelectItem value="coordenacao">Coordenação</SelectItem>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="responsavel">Responsável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Criar Usuário
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <Badge variant="secondary" className="mt-2">{user.role}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Usuarios;
