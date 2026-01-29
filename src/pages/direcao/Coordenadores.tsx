import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PendingUsersAlert } from "@/components/PendingUsersAlert";

const Coordenadores = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCoordenadorId, setSelectedCoordenadorId] = useState("");
  const [selectedAtividadeId, setSelectedAtividadeId] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch coordenadores e suas atividades
  const { data: coordenadorAtividades, isLoading } = useQuery({
    queryKey: ["coordenador-atividades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coordenador_atividades")
        .select(`
          *,
          coordenador:profiles!coordenador_atividades_coordenador_id_fkey(nome_completo, email),
          atividade:atividades(nome, ativa)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch usuários com role coordenacao (para dropdown e contagem de pendentes)
  const { data: coordenadores } = useQuery({
    queryKey: ["users-coordenacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles(id, nome_completo, email)")
        .eq("role", "coordenacao");

      if (error) throw error;
      return data?.map((ur) => ur.profiles).filter(Boolean) || [];
    },
  });

  // Coordenadores sem nenhuma atividade atribuída
  const coordenadoresSemAtividade = coordenadores?.filter((coord: any) => {
    const temAtividade = coordenadorAtividades?.some(
      (ca: any) => ca.coordenador_id === coord.id
    );
    return !temAtividade;
  }) || [];

  // Fetch atividades
  const { data: atividades } = useQuery({
    queryKey: ["atividades-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select("id, nome, ativa")
        .order("nome");

      if (error) throw error;
      return data;
    },
    enabled: dialogOpen,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: { coordenador_id: string; atividade_id: string }) => {
      const { error } = await supabase
        .from("coordenador_atividades")
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordenador-atividades"] });
      toast({
        title: "Coordenador atribuído",
        description: "O coordenador foi atribuído à atividade com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atribuir o coordenador.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("coordenador_atividades")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordenador-atividades"] });
      toast({
        title: "Atribuição removida",
        description: "O coordenador foi removido da atividade.",
      });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover",
        description: error.message || "Não foi possível remover a atribuição.",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = () => {
    setSelectedCoordenadorId("");
    setSelectedAtividadeId("");
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormErrors({});
  };

  const handleSubmit = () => {
    if (!selectedCoordenadorId || !selectedAtividadeId) {
      setFormErrors({
        coordenador: !selectedCoordenadorId ? "Selecione um coordenador" : "",
        atividade: !selectedAtividadeId ? "Selecione uma atividade" : "",
      });
      return;
    }

    createMutation.mutate({
      coordenador_id: selectedCoordenadorId,
      atividade_id: selectedAtividadeId,
    });
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

  // Agrupar por coordenador
  const coordenadoresAgrupados = coordenadorAtividades?.reduce((acc: any, item: any) => {
    const coordId = item.coordenador_id;
    if (!acc[coordId]) {
      acc[coordId] = {
        coordenador: item.coordenador,
        atividades: [],
      };
    }
    acc[coordId].atividades.push({
      id: item.id,
      atividade: item.atividade,
    });
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Coordenadores</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie coordenadores e suas atividades
            </p>
          </div>
          <Button onClick={handleOpenDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Atribuir Coordenador
          </Button>
        </div>

        {/* Alerta de coordenadores sem atividade */}
        <PendingUsersAlert 
          count={coordenadoresSemAtividade.length} 
          role="coordenacao" 
          linkTo="/convites" 
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : coordenadoresAgrupados && Object.keys(coordenadoresAgrupados).length > 0 ? (
          <div className="grid gap-4">
            {Object.values(coordenadoresAgrupados).map((item: any) => (
              <Card key={item.coordenador.id}>
                <CardHeader>
                  <CardTitle className="text-xl">{item.coordenador.nome_completo}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.coordenador.email}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Atividades Coordenadas:</h4>
                    <div className="space-y-2">
                      {item.atividades.map((ativ: any) => (
                        <div
                          key={ativ.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{ativ.atividade.nome}</span>
                            <Badge variant={ativ.atividade.ativa ? "default" : "secondary"}>
                              {ativ.atividade.ativa ? "Ativa" : "Inativa"}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ativ.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhum coordenador atribuído ainda.
              </p>
              <Button onClick={handleOpenDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Atribuir Primeiro Coordenador
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialog para atribuir */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Atribuir Coordenador</DialogTitle>
              <DialogDescription>
                Selecione um coordenador e uma atividade para atribuição.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="coordenador">Coordenador *</Label>
                <Select
                  value={selectedCoordenadorId}
                  onValueChange={setSelectedCoordenadorId}
                >
                  <SelectTrigger id="coordenador">
                    <SelectValue placeholder="Selecione um coordenador" />
                  </SelectTrigger>
                  <SelectContent>
                    {coordenadores?.map((coord: any) => (
                      <SelectItem key={coord.id} value={coord.id}>
                        {coord.nome_completo} ({coord.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.coordenador && (
                  <p className="text-sm text-destructive">{formErrors.coordenador}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="atividade">Atividade *</Label>
                <Select
                  value={selectedAtividadeId}
                  onValueChange={setSelectedAtividadeId}
                >
                  <SelectTrigger id="atividade">
                    <SelectValue placeholder="Selecione uma atividade" />
                  </SelectTrigger>
                  <SelectContent>
                    {atividades?.map((atividade) => (
                      <SelectItem key={atividade.id} value={atividade.id}>
                        {atividade.nome} {!atividade.ativa && "(Inativa)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.atividade && (
                  <p className="text-sm text-destructive">{formErrors.atividade}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Atribuir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação para deletar */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover esta atribuição? O coordenador perderá acesso à
                atividade.
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
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Coordenadores;
