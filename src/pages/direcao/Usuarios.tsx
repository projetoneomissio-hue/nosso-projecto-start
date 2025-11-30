import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Usuarios = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

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
        role: u.user_roles?.[0]?.role || "sem_role",
        status: "ativo",
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete user_roles first
      const { error: rolesError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

      // Note: We cannot delete from auth.users via client
      // In production, this should trigger a server-side function
      toast({
        title: "Função não implementada",
        description: "A remoção completa do usuário requer uma função de servidor.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setDeleteUserId(null);
    },
  });

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      direcao: "Direção",
      coordenacao: "Coordenação",
      professor: "Professor",
      responsavel: "Responsável",
      sem_role: "Sem Perfil",
    };
    return labels[role] || role;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Gerenciar Usuários
            </h1>
            <p className="text-muted-foreground mt-1">
              Controle de acesso e permissões
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                ))}
              </div>
            ) : !usuarios || usuarios.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </p>
            ) : (
              <div className="space-y-4">
                {usuarios.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="mt-2">
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteUserId(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Tem certeza que deseja remover este
              usuário?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Usuarios;
