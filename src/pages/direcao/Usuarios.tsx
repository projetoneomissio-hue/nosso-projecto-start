import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/utils/error-handler";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, UserCog } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type AppRole = "direcao" | "coordenacao" | "professor" | "responsavel";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: AppRole | "sem_role";
}

const Usuarios = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          nome_completo,
          email,
          user_roles (role)
        `);

      if (error) throw error;

      return (data || []).map((u: any) => ({
        id: u.id,
        name: u.nome_completo,
        email: u.email,
        role: u.user_roles?.[0]?.role as AppRole || "sem_role",
      })) as UserData[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // Check if user already has a role
      const { data: existingRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (existingRoles && existingRoles.length > 0) {
        // Update existing
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast({
        title: "Sucesso",
        description: "Papel do usuário atualizado com sucesso.",
      });
    },
    onError: (error) => {
      handleError(error, "Erro ao atualizar papel");
    },
  });

  const filteredUsers = usuarios?.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleLabels: Record<string, string> = {
    direcao: "Direção",
    coordenacao: "Coordenação",
    professor: "Professor",
    responsavel: "Responsável",
    sem_role: "Sem Perfil",
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Gerenciar Usuários
            </h1>
            <p className="text-muted-foreground mt-1">
              Controle de níveis de acesso e permissões do sistema
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-card p-4 rounded-lg border shadow-sm">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none focus-visible:ring-0"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Usuários Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 border rounded-lg flex justify-between items-center">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                  </div>
                ))}
              </div>
            ) : !filteredUsers || filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">
                  Nenhum usuário encontrado para "{searchTerm}"
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        {user.role === "sem_role" && (
                          <Badge variant="destructive">Sem Acesso</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground hidden lg:block">Nível de Acesso:</span>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          updateRoleMutation.mutate({ userId: user.id, newRole: value as AppRole })
                        }
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Selecione um papel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direcao">Direção</SelectItem>
                          <SelectItem value="coordenacao">Coordenação</SelectItem>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="responsavel">Responsável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Usuarios;
