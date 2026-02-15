import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCog, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { PremiumEmptyState } from "@/components/ui/premium-empty-state";
import { handleError } from "@/utils/error-handler";
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
        title: "Sucesso",
        description: "Associação removida com sucesso.",
      });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error) => {
      handleError(error, "Erro ao remover associação");
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
    // Robustness check: Ensure coordinator exists
    if (!item.coordenador) return acc;

    const coordId = item.coordenador_id;
    if (!acc[coordId]) {
      acc[coordId] = {
        coordenador: item.coordenador,
        atividades: [],
      };
    }
    acc[coordId].atividades.push({
      id: item.id,
      atividade: item.atividade || { nome: "Atividade não encontrada" },
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
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : coordenadoresAgrupados && Object.keys(coordenadoresAgrupados).length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            {Object.entries(coordenadoresAgrupados).map(([coordId, data]: [string, any]) => (
              <Card key={coordId} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <UserCog className="h-5 w-5 text-primary" />
                      </div>
                      {data.coordenador?.nome_completo}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{data.coordenador?.email}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Atividades sob Coordenação
                    </h4>
                    <div className="grid gap-2">
                      {data.atividades.map((assoc: any) => (
                        <div
                          key={assoc.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-accent/30 group/item hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{assoc.atividade?.nome}</span>
                            <Badge variant={assoc.atividade?.ativa ? "default" : "secondary"}>
                              {assoc.atividade?.ativa ? "Ativa" : "Inativa"}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setDeletingId(assoc.id);
                              setDeleteDialogOpen(true);
                            }}
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
          <PremiumEmptyState
            title="Nenhum coordenador atribuído"
            description="Atribua atividades aos coordenadores para visualizar e gerenciar as responsabilidades aqui."
            icon={UserCog}
            actionLabel="Atribuir Primeiro Coordenador"
            onAction={handleOpenDialog}
          />
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
