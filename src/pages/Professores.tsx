import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { PendingUsersAlert } from "@/components/PendingUsersAlert";

const professorSchema = z.object({
  user_id: z.string().uuid("Selecione um usuário"),
  especialidade: z.string().trim().max(200, "Especialidade muito longa").optional().nullable(),
  percentual_comissao: z.number().min(0, "Comissão deve ser positiva").max(100, "Comissão deve ser no máximo 100%"),
  ativo: z.boolean(),
});

type ProfessorFormData = z.infer<typeof professorSchema>;

const Professores = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfessorFormData>({
    user_id: "",
    especialidade: "",
    percentual_comissao: 15,
    ativo: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch professores com user profile e estatísticas
  const { data: professores, isLoading } = useQuery({
    queryKey: ["professores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professores")
        .select(`
          *,
          user:profiles(nome_completo, email),
          turmas(
            id,
            nome,
            matriculas(count)
          )
        `)
        .order("ativo", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch users que não são professores ainda (sempre ativo para mostrar alerta)
  const { data: availableUsers } = useQuery({
    queryKey: ["available-users-professor"],
    queryFn: async () => {
      // Busca usuários com role professor que ainda não tem registro na tabela professores
      const { data: professoresExistentes, error: e1 } = await supabase
        .from("professores")
        .select("user_id");
      
      if (e1) throw e1;
      
      const userIdsExistentes = professoresExistentes?.map(p => p.user_id) || [];
      
      const { data: userRoles, error: e2 } = await supabase
        .from("user_roles")
        .select("user_id, profiles(id, nome_completo, email)")
        .eq("role", "professor");
      
      if (e2) throw e2;
      
      return userRoles
        ?.filter(ur => !userIdsExistentes.includes(ur.user_id))
        .map(ur => ur.profiles)
        .filter(Boolean) || [];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ProfessorFormData) => {
      const payload = {
        user_id: data.user_id,
        especialidade: data.especialidade || null,
        percentual_comissao: data.percentual_comissao,
        ativo: data.ativo,
      };

      if (editingProfessor) {
        const { error } = await supabase
          .from("professores")
          .update(payload)
          .eq("id", editingProfessor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("professores")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professores"] });
      queryClient.invalidateQueries({ queryKey: ["available-users-professor"] });
      toast({
        title: editingProfessor ? "Professor atualizado" : "Professor cadastrado",
        description: editingProfessor 
          ? "Os dados do professor foram atualizados."
          : "O professor foi cadastrado com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o professor.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("professores")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professores"] });
      toast({
        title: "Professor excluído",
        description: "O professor foi excluído com sucesso.",
      });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o professor.",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (professor?: any) => {
    if (professor) {
      setEditingProfessor(professor);
      setFormData({
        user_id: professor.user_id,
        especialidade: professor.especialidade || "",
        percentual_comissao: parseFloat(professor.percentual_comissao.toString()),
        ativo: professor.ativo,
      });
    } else {
      setEditingProfessor(null);
      setFormData({
        user_id: "",
        especialidade: "",
        percentual_comissao: 15,
        ativo: true,
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProfessor(null);
    setFormErrors({});
  };

  const handleSubmit = () => {
    try {
      const validated = professorSchema.parse(formData);
      setFormErrors({});
      saveMutation.mutate(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
      }
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  const calculateComissao = (professor: any) => {
    const totalAlunos = professor.turmas?.reduce(
      (acc: number, t: any) => acc + (t.matriculas?.[0]?.count || 0),
      0
    ) || 0;
    
    // Busca valor médio das atividades das turmas (simplificado)
    // Na prática, deveria buscar o valor específico de cada matrícula
    const valorMedioPorAluno = 150; // Valor exemplo
    const comissao = (totalAlunos * valorMedioPorAluno * parseFloat(professor.percentual_comissao.toString())) / 100;
    
    return comissao;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Professores</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie professores e comissões
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Professor
          </Button>
        </div>

        {/* Alerta de professores pendentes */}
        <PendingUsersAlert 
          count={availableUsers?.length || 0} 
          role="professor" 
          linkTo="/convites" 
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : professores && professores.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Professores Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {professores.map((prof) => {
                  const totalAlunos = prof.turmas?.reduce(
                    (acc: number, t: any) => acc + (t.matriculas?.[0]?.count || 0),
                    0
                  ) || 0;
                  const comissaoEstimada = calculateComissao(prof);
                  
                  return (
                    <div
                      key={prof.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{prof.user.nome_completo}</h3>
                          <Badge variant={prof.ativo ? "default" : "secondary"}>
                            {prof.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        {prof.especialidade && (
                          <p className="text-sm text-muted-foreground">{prof.especialidade}</p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>{totalAlunos} alunos</span>
                          <span>{prof.turmas?.length || 0} turmas</span>
                          <span>Comissão: {parseFloat(prof.percentual_comissao.toString())}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Comissão Estimada</p>
                          <p className="text-lg font-bold flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {comissaoEstimada.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(prof)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(prof.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhum professor cadastrado ainda.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Professor
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialog para criar/editar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingProfessor ? "Editar Professor" : "Novo Professor"}
              </DialogTitle>
              <DialogDescription>
                {editingProfessor
                  ? "Atualize as informações do professor."
                  : "Cadastre um novo professor no sistema."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {!editingProfessor && (
                <div className="space-y-2">
                  <Label htmlFor="user_id">Usuário *</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, user_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.nome_completo} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.user_id && (
                    <p className="text-sm text-destructive">{formErrors.user_id}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input
                  id="especialidade"
                  value={formData.especialidade || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, especialidade: e.target.value })
                  }
                  placeholder="Ex: Artes Marciais, Dança, Música"
                />
                {formErrors.especialidade && (
                  <p className="text-sm text-destructive">{formErrors.especialidade}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentual_comissao">Percentual de Comissão (%) *</Label>
                <Input
                  id="percentual_comissao"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.percentual_comissao}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      percentual_comissao: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                {formErrors.percentual_comissao && (
                  <p className="text-sm text-destructive">
                    {formErrors.percentual_comissao}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                disabled={saveMutation.isPending}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
                {saveMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingProfessor ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação para deletar */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este professor? Esta ação não pode ser
                desfeita e pode afetar turmas associadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Professores;
