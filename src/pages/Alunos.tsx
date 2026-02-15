import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, Search, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/utils/error-handler";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const alunoSchema = z.object({
  nome_completo: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(200, "Nome muito longo"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  cpf: z.string().trim().regex(/^\d{11}$/, "CPF deve conter 11 dígitos").optional().nullable().or(z.literal("")),
  telefone: z.string().trim().max(20, "Telefone muito longo").optional().nullable().or(z.literal("")),
  endereco: z.string().trim().max(500, "Endereço muito longo").optional().nullable().or(z.literal("")),
  responsavel_id: z.string().uuid("ID do responsável inválido"),
});

type AlunoFormData = z.infer<typeof alunoSchema>;

const Alunos = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: {
      nome_completo: "",
      data_nascimento: "",
      cpf: "",
      telefone: "",
      endereco: "",
      responsavel_id: "",
    },
  });

  // Fetch alunos
  const { data: alunos, isLoading } = useQuery({
    queryKey: ["alunos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alunos")
        .select(`
          *,
          responsavel:profiles!alunos_responsavel_id_fkey(nome_completo, email)
        `)
        .order("nome_completo");

      if (error) throw error;
      return data;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (values: AlunoFormData) => {
      const payload = {
        nome_completo: values.nome_completo,
        data_nascimento: values.data_nascimento,
        cpf: values.cpf || null,
        telefone: values.telefone || null,
        endereco: values.endereco || null,
        responsavel_id: values.responsavel_id,
      };

      if (editingAluno) {
        const { error } = await supabase
          .from("alunos")
          .update(payload)
          .eq("id", editingAluno.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("alunos")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      toast({
        title: editingAluno ? "Aluno atualizado" : "Aluno cadastrado",
        description: editingAluno
          ? "Os dados do aluno foram atualizados com sucesso."
          : "O aluno foi cadastrado com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      handleError(error, "Erro ao salvar aluno");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alunos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      toast({
        title: "Aluno excluído",
        description: "O aluno foi excluído com sucesso.",
      });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error: any) => {
      handleError(error, "Erro ao excluir aluno");
    },
  });

  const handleOpenDialog = (aluno?: any) => {
    if (aluno) {
      setEditingAluno(aluno);
      form.reset({
        nome_completo: aluno.nome_completo,
        data_nascimento: aluno.data_nascimento,
        cpf: aluno.cpf || "",
        telefone: aluno.telefone || "",
        endereco: aluno.endereco || "",
        responsavel_id: aluno.responsavel_id,
      });
    } else {
      setEditingAluno(null);
      form.reset({
        nome_completo: "",
        data_nascimento: "",
        cpf: "",
        telefone: "",
        endereco: "",
        responsavel_id: user?.id || "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAluno(null);
    form.reset();
  };

  const onSubmit = (values: AlunoFormData) => {
    saveMutation.mutate(values);
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

  const filteredAlunos = alunos?.filter((aluno) =>
    aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os alunos cadastrados
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Aluno
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[100px] w-full rounded-lg" />
            <Skeleton className="h-[100px] w-full rounded-lg" />
            <Skeleton className="h-[100px] w-full rounded-lg" />
          </div>
        ) : filteredAlunos && filteredAlunos.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Alunos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlunos.map((aluno) => (
                  <div
                    key={aluno.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-3"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{aluno.nome_completo}</h3>
                      <div className="text-sm text-muted-foreground space-y-1 mt-1">
                        <p>Idade: {calculateAge(aluno.data_nascimento)} anos</p>
                        {aluno.responsavel && (
                          <p>Responsável: {aluno.responsavel.nome_completo}</p>
                        )}
                        {aluno.telefone && <p>Tel: {aluno.telefone}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(aluno)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(aluno.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <PremiumEmptyState
            title={searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
            description={searchTerm
              ? `Não encontramos resultados para "${searchTerm}". Tente buscar por outro nome.`
              : "Comece cadastrando seu primeiro aluno para gerenciar matrículas e presenças."}
            icon={UserPlus}
            actionLabel={!searchTerm ? "Cadastrar Primeiro Aluno" : undefined}
            onAction={!searchTerm ? () => handleOpenDialog() : undefined}
          />
        )}

        {/* Dialog para criar/editar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAluno ? "Editar Aluno" : "Novo Aluno"}
              </DialogTitle>
              <DialogDescription>
                {editingAluno
                  ? "Atualize as informações do aluno."
                  : "Preencha os dados para cadastrar um novo aluno."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="nome_completo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do aluno" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="00000000000"
                            maxLength={11}
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço completo" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={saveMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingAluno ? "Atualizar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação para deletar */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este aluno? Esta ação não pode ser
                desfeita e irá remover todas as matrículas associadas.
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

export default Alunos;
