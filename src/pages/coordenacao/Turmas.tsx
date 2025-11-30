import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, Calendar, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const DIAS_SEMANA = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

const turmaSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(200, "Nome muito longo"),
  atividade_id: z.string().uuid("Selecione uma atividade"),
  professor_id: z.string().uuid("Selecione um professor").optional().nullable(),
  horario: z.string().trim().min(1, "Horário é obrigatório"),
  dias_semana: z.array(z.string()).min(1, "Selecione pelo menos um dia"),
  capacidade_maxima: z.number().int().positive("Capacidade deve ser positiva").max(9999, "Capacidade muito alta"),
  ativa: z.boolean(),
});

type TurmaFormData = z.infer<typeof turmaSchema>;

const Turmas = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TurmaFormData>({
    nome: "",
    atividade_id: "",
    professor_id: null,
    horario: "",
    dias_semana: [],
    capacidade_maxima: 20,
    ativa: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch turmas com contagem de matrículas
  const { data: turmas, isLoading } = useQuery({
    queryKey: ["turmas-coordenacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas")
        .select(`
          *,
          atividade:atividades(nome),
          professor:professores(id, user:profiles(nome_completo)),
          matriculas(count)
        `)
        .order("nome");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch atividades
  const { data: atividades } = useQuery({
    queryKey: ["atividades-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select("id, nome")
        .eq("ativa", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch professores
  const { data: professores } = useQuery({
    queryKey: ["professores-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professores")
        .select("id, user:profiles(nome_completo)")
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TurmaFormData) => {
      const payload = {
        nome: data.nome,
        atividade_id: data.atividade_id,
        professor_id: data.professor_id || null,
        horario: data.horario,
        dias_semana: data.dias_semana,
        capacidade_maxima: data.capacidade_maxima,
        ativa: data.ativa,
      };

      if (editingTurma) {
        const { error } = await supabase
          .from("turmas")
          .update(payload)
          .eq("id", editingTurma.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("turmas")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas-coordenacao"] });
      toast({
        title: editingTurma ? "Turma atualizada" : "Turma criada",
        description: editingTurma 
          ? "A turma foi atualizada com sucesso."
          : "A turma foi criada com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a turma.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("turmas")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turmas-coordenacao"] });
      toast({
        title: "Turma excluída",
        description: "A turma foi excluída com sucesso.",
      });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a turma.",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (turma?: any) => {
    if (turma) {
      setEditingTurma(turma);
      setFormData({
        nome: turma.nome,
        atividade_id: turma.atividade_id,
        professor_id: turma.professor_id,
        horario: turma.horario,
        dias_semana: turma.dias_semana,
        capacidade_maxima: turma.capacidade_maxima,
        ativa: turma.ativa,
      });
    } else {
      setEditingTurma(null);
      setFormData({
        nome: "",
        atividade_id: "",
        professor_id: null,
        horario: "",
        dias_semana: [],
        capacidade_maxima: 20,
        ativa: true,
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTurma(null);
    setFormErrors({});
  };

  const handleSubmit = () => {
    try {
      const validated = turmaSchema.parse(formData);
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

  const toggleDia = (dia: string) => {
    setFormData((prev) => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter((d) => d !== dia)
        : [...prev.dias_semana, dia],
    }));
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Turmas</h1>
            <p className="text-muted-foreground">
              Gerencie as turmas das suas atividades
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Turma
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : turmas && turmas.length > 0 ? (
          <div className="grid gap-4">
            {turmas.map((turma) => {
              const matriculasCount = turma.matriculas?.[0]?.count || 0;
              const vagasDisponiveis = turma.capacidade_maxima - matriculasCount;
              
              return (
                <Card key={turma.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{turma.nome}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {turma.atividade?.nome}
                        </p>
                        {turma.professor?.user && (
                          <p className="text-sm text-muted-foreground">
                            Prof: {turma.professor.user.nome_completo}
                          </p>
                        )}
                      </div>
                      <Badge variant={turma.ativa ? "default" : "secondary"}>
                        {turma.ativa ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{turma.horario}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{turma.dias_semana.join(", ")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {matriculasCount}/{turma.capacidade_maxima} alunos
                        </span>
                        <Badge variant={vagasDisponiveis > 0 ? "default" : "destructive"} className="ml-2">
                          {vagasDisponiveis > 0 ? `${vagasDisponiveis} vagas` : "Lotado"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(turma)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(turma.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhuma turma cadastrada ainda.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Turma
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialog para criar/editar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTurma ? "Editar Turma" : "Nova Turma"}
              </DialogTitle>
              <DialogDescription>
                {editingTurma
                  ? "Atualize as informações da turma."
                  : "Preencha os dados para criar uma nova turma."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Turma *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Ex: Futebol Iniciante - Manhã"
                />
                {formErrors.nome && (
                  <p className="text-sm text-destructive">{formErrors.nome}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="atividade_id">Atividade *</Label>
                <Select
                  value={formData.atividade_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, atividade_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma atividade" />
                  </SelectTrigger>
                  <SelectContent>
                    {atividades?.map((atividade) => (
                      <SelectItem key={atividade.id} value={atividade.id}>
                        {atividade.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.atividade_id && (
                  <p className="text-sm text-destructive">{formErrors.atividade_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="professor_id">Professor</Label>
                <Select
                  value={formData.professor_id || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, professor_id: value || null })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um professor (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {professores?.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.user.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horario">Horário *</Label>
                  <Input
                    id="horario"
                    value={formData.horario}
                    onChange={(e) =>
                      setFormData({ ...formData, horario: e.target.value })
                    }
                    placeholder="Ex: 14:00 - 15:30"
                  />
                  {formErrors.horario && (
                    <p className="text-sm text-destructive">{formErrors.horario}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacidade_maxima">Capacidade Máxima *</Label>
                  <Input
                    id="capacidade_maxima"
                    type="number"
                    min="1"
                    value={formData.capacidade_maxima}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacidade_maxima: parseInt(e.target.value, 10) || 0,
                      })
                    }
                  />
                  {formErrors.capacidade_maxima && (
                    <p className="text-sm text-destructive">
                      {formErrors.capacidade_maxima}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dias da Semana *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DIAS_SEMANA.map((dia) => (
                    <div key={dia} className="flex items-center space-x-2">
                      <Checkbox
                        id={dia}
                        checked={formData.dias_semana.includes(dia)}
                        onCheckedChange={() => toggleDia(dia)}
                      />
                      <label
                        htmlFor={dia}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {dia}
                      </label>
                    </div>
                  ))}
                </div>
                {formErrors.dias_semana && (
                  <p className="text-sm text-destructive">{formErrors.dias_semana}</p>
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
                {editingTurma ? "Atualizar" : "Criar"}
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
                Tem certeza que deseja excluir esta turma? Esta ação não pode ser
                desfeita e pode afetar matrículas associadas.
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

export default Turmas;
