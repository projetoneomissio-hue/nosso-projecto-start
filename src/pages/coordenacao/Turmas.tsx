import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, Calendar, Plus, Pencil, Trash2, Loader2, Award, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumEmptyState } from "@/components/ui/premium-empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { pdf } from "@react-pdf/renderer";
import { ListaAlunosPDF } from "@/components/reports/ListaAlunosPDF";
import { GerarCertificadosDialog } from "@/components/certificates/GerarCertificadosDialog";
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
import { useTurmas, useAtividades, useProfessores, useTurmaMutations, useTurmaAlunos } from "@/hooks/useTurmas";
import { turmasService } from "@/services/turmas.service";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/utils/error-handler";
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
  const [selectedTurmaCertificados, setSelectedTurmaCertificados] = useState<any>(null);
  const [editingTurma, setEditingTurma] = useState<any>(null);
  const [viewingTurmaAlunos, setViewingTurmaAlunos] = useState<any>(null);
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

  const { data: turmas, isLoading } = useTurmas();
  const { data: atividades } = useAtividades();
  const { data: professores } = useProfessores();
  const { saveMutation: turmaSaveMutation, deleteMutation: turmaDeleteMutation } = useTurmaMutations();

  const handleSaveTurma = (data: TurmaFormData) => {
    const payload = {
      nome: data.nome,
      atividade_id: data.atividade_id,
      professor_id: data.professor_id || null,
      horario: data.horario,
      dias_semana: data.dias_semana,
      capacidade_maxima: data.capacidade_maxima,
      ativa: data.ativa,
    };

    turmaSaveMutation.mutate(
      { id: editingTurma?.id, data: payload },
      { onSuccess: () => handleCloseDialog() }
    );
  };

  const { data: listAlunos, isLoading: isLoadingAlunos } = useTurmaAlunos(viewingTurmaAlunos?.id);

  const confirmDelete = () => {
    if (deletingId) {
      turmaDeleteMutation.mutate(deletingId, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setDeletingId(null);
        },
      });
    }
  };

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
      handleSaveTurma(validated);
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

  const toggleDia = (dia: string) => {
    setFormData((prev) => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter((d) => d !== dia)
        : [...prev.dias_semana, dia],
    }));
  };

  const handleExportAlunos = async (turma: any) => {
    try {
      toast({
        title: "Gerando PDF...",
        description: "Buscando dados dos alunos da turma.",
      });

      const alunosData = await turmasService.fetchAlunosDaTurma(turma.id);

      const blob = await pdf(
        <ListaAlunosPDF
          turmaNome={turma.nome}
          atividadeNome={turma.atividade?.nome}
          alunos={alunosData}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lista-alunos-${turma.nome.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Lista exportada!",
        description: `O PDF da turma ${turma.nome} foi baixado.`,
      });
    } catch (error: any) {
      handleError(error, "Erro ao exportar lista de alunos");
    }
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
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </CardContent>
              </Card>
            ))}
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
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {matriculasCount}/{turma.capacidade_maxima} alunos
                            </span>
                          </div>
                          <Badge variant={vagasDisponiveis > 0 ? "default" : "destructive"}>
                            {vagasDisponiveis > 0 ? `${vagasDisponiveis} vagas` : "Lotado"}
                          </Badge>
                        </div>
                        {/* Barra de ocupação visual */}
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${matriculasCount / turma.capacidade_maxima >= 0.9
                              ? "bg-destructive"
                              : matriculasCount / turma.capacidade_maxima >= 0.7
                                ? "bg-yellow-500"
                                : "bg-primary"
                              }`}
                            style={{
                              width: `${Math.min(100, (matriculasCount / turma.capacidade_maxima) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingTurmaAlunos(turma)}
                        className="gap-2"
                      >
                        <Users className="h-3 w-3" />
                        Ver Alunos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportAlunos(turma)}
                        className="gap-2"
                        title="Exportar Lista PDF"
                      >
                        <FileText className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTurmaCertificados(turma)}
                        className="gap-2"
                        title="Certificados"
                      >
                        <Award className="h-3 w-3" />
                      </Button>
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
          <PremiumEmptyState
            title="Sua jornada começa aqui"
            description="Crie turmas para organizar horários, professores e alunos. Uma turma bem organizada é a base de um centro eficiente."
            icon={Users}
            actionLabel="Criar Primeira Turma"
            onAction={() => handleOpenDialog()}
          />
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
                disabled={turmaSaveMutation.isPending}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={turmaSaveMutation.isPending}>
                {turmaSaveMutation.isPending && (
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
              <AlertDialogCancel disabled={turmaDeleteMutation.isPending}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={turmaDeleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {turmaDeleteMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* Dialog de Certificados */}
        {selectedTurmaCertificados && (
          <GerarCertificadosDialog
            open={!!selectedTurmaCertificados}
            onOpenChange={(open) => !open && setSelectedTurmaCertificados(null)}
            turma={selectedTurmaCertificados}
          />
        )}

        {/* Sheet de Listagem de Alunos */}
        <Sheet open={!!viewingTurmaAlunos} onOpenChange={(open) => !open && setViewingTurmaAlunos(null)}>
          <SheetContent className="sm:max-w-[540px] w-full">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Alunos da Turma
              </SheetTitle>
              <SheetDescription className="text-lg font-medium text-foreground">
                {viewingTurmaAlunos?.nome} — {viewingTurmaAlunos?.atividade?.nome}
              </SheetDescription>
            </SheetHeader>

            {isLoadingAlunos ? (
              <div className="space-y-4 py-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : listAlunos && listAlunos.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                <div className="space-y-6">
                  <div className="bg-muted/30 p-4 rounded-lg border border-border flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground mb-1">Dica de Gestão</p>
                      Alunos importados via planilha podem aparecer com um "Responsável Temporário".
                      Isso é normal até que o responsável real realize o cadastro no sistema.
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Aluno</TableHead>
                        <TableHead className="w-[100px]">Idade</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listAlunos.map((aluno: any) => (
                        <TableRow key={aluno.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{aluno.nome_completo}</p>
                              {aluno.responsavel?.profiles?.tipo === 'placeholder' && (
                                <Badge variant="outline" className="text-[10px] h-4 font-normal mt-1 opacity-70">
                                  Importado
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {aluno.data_nascimento ?
                              Math.floor((new Date().getTime() - new Date(aluno.data_nascimento).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) + ' anos'
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {/* Futuras ações rápidas podem ser adicionadas aqui */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <HelpCircle className="h-4 w-4 opacity-50" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Ver detalhes do aluno em breve
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            ) : (
              <div className="py-20 text-center space-y-3">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">Nenhum aluno matriculado</h3>
                <p className="text-muted-foreground max-w-[300px] mx-auto">
                  Esta turma ainda não possui alunos. Comece a matricular novos alunos para vê-los aqui.
                </p>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout >
  );
};

export default Turmas;
