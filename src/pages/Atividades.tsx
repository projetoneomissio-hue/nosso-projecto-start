import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

const atividadeSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  descricao: z.string().trim().max(500, "Descrição muito longa").optional().nullable(),
  valor_mensal: z.number().positive("Valor deve ser positivo").max(99999, "Valor muito alto"),
  capacidade_maxima: z.number().int().positive("Capacidade deve ser positiva").max(9999, "Capacidade muito alta").optional().nullable(),
  ativa: z.boolean(),
});

type AtividadeFormData = z.infer<typeof atividadeSchema>;

const Atividades = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAtividade, setEditingAtividade] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AtividadeFormData>({
    nome: "",
    descricao: "",
    valor_mensal: 0,
    capacidade_maxima: null,
    ativa: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch atividades
  const { data: atividades, isLoading } = useQuery({
    queryKey: ["atividades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      return data;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: AtividadeFormData) => {
      const payload = {
        nome: data.nome,
        descricao: data.descricao || null,
        valor_mensal: data.valor_mensal,
        capacidade_maxima: data.capacidade_maxima || null,
        ativa: data.ativa,
      };

      if (editingAtividade) {
        const { error } = await supabase
          .from("atividades")
          .update(payload)
          .eq("id", editingAtividade.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("atividades")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades"] });
      toast({
        title: editingAtividade ? "Atividade atualizada" : "Atividade criada",
        description: editingAtividade 
          ? "A atividade foi atualizada com sucesso."
          : "A atividade foi criada com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a atividade.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("atividades")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades"] });
      toast({
        title: "Atividade excluída",
        description: "A atividade foi excluída com sucesso.",
      });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a atividade.",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (atividade?: any) => {
    if (atividade) {
      setEditingAtividade(atividade);
      setFormData({
        nome: atividade.nome,
        descricao: atividade.descricao || "",
        valor_mensal: parseFloat(atividade.valor_mensal),
        capacidade_maxima: atividade.capacidade_maxima,
        ativa: atividade.ativa,
      });
    } else {
      setEditingAtividade(null);
      setFormData({
        nome: "",
        descricao: "",
        valor_mensal: 0,
        capacidade_maxima: null,
        ativa: true,
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAtividade(null);
    setFormErrors({});
  };

  const handleSubmit = () => {
    try {
      const validated = atividadeSchema.parse(formData);
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

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Atividades</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as atividades oferecidas
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Atividade
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : atividades && atividades.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {atividades.map((atividade) => (
              <Card key={atividade.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{atividade.nome}</CardTitle>
                    <Badge variant={atividade.ativa ? "default" : "secondary"}>
                      {atividade.ativa ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  {atividade.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {atividade.descricao}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <span className="font-semibold">Valor Mensal:</span>{" "}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(parseFloat(atividade.valor_mensal.toString()))}
                  </div>
                  {atividade.capacidade_maxima && (
                    <div className="text-sm">
                      <span className="font-semibold">Capacidade:</span>{" "}
                      {atividade.capacidade_maxima} alunos
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenDialog(atividade)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(atividade.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhuma atividade cadastrada ainda.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Atividade
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialog para criar/editar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingAtividade ? "Editar Atividade" : "Nova Atividade"}
              </DialogTitle>
              <DialogDescription>
                {editingAtividade
                  ? "Atualize as informações da atividade."
                  : "Preencha os dados para criar uma nova atividade."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Ex: Jiu-Jitsu"
                />
                {formErrors.nome && (
                  <p className="text-sm text-destructive">{formErrors.nome}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Breve descrição da atividade"
                  rows={3}
                />
                {formErrors.descricao && (
                  <p className="text-sm text-destructive">{formErrors.descricao}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_mensal">Valor Mensal (R$) *</Label>
                  <Input
                    id="valor_mensal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_mensal || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valor_mensal: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                  {formErrors.valor_mensal && (
                    <p className="text-sm text-destructive">
                      {formErrors.valor_mensal}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacidade_maxima">Capacidade Máxima</Label>
                  <Input
                    id="capacidade_maxima"
                    type="number"
                    min="1"
                    value={formData.capacidade_maxima || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacidade_maxima: e.target.value
                          ? parseInt(e.target.value, 10)
                          : null,
                      })
                    }
                    placeholder="Ex: 30"
                  />
                  {formErrors.capacidade_maxima && (
                    <p className="text-sm text-destructive">
                      {formErrors.capacidade_maxima}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="ativa">Atividade Ativa</Label>
                <Switch
                  id="ativa"
                  checked={formData.ativa}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ativa: checked })
                  }
                />
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
                {editingAtividade ? "Atualizar" : "Criar"}
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
                Tem certeza que deseja excluir esta atividade? Esta ação não pode
                ser desfeita e pode afetar turmas e matrículas associadas.
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

export default Atividades;
