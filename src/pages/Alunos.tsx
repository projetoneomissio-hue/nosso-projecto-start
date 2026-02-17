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
import { ContactTimeline } from "@/components/alunos/ContactTimeline";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Calendar,
  IdCard,
  Phone,
  MapPin,
  Users,
  Check,
  ChevronsUpDown,
  CalendarClock,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
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
import { formatCPF, unmaskCPF, validateCPF } from "@/utils/cpf";
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
  cpf: z.string().trim().optional().nullable().or(z.literal("")).refine(
    (val) => {
      if (!val || val === "") return true;
      const clean = val.replace(/\D/g, "");
      if (clean.length === 0) return true;
      if (clean.length !== 11) return false;
      return validateCPF(clean);
    },
    { message: "CPF inválido. Verifique os dígitos." }
  ),
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

  // State Contact Timeline
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedAlunoForTimeline, setSelectedAlunoForTimeline] = useState<any>(null);

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

  // Fetch profiles (for responsable selection)
  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome_completo, email")
        .order("nome_completo");

      if (error) throw error;
      return data;
    },
    enabled: user?.role === "direcao" || user?.role === "coordenacao",
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (values: AlunoFormData) => {
      const cleanCpf = values.cpf ? unmaskCPF(values.cpf) : null;

      // Check for duplicate CPF if provided
      if (cleanCpf && cleanCpf.length === 11) {
        const { data: existing, error: checkError } = await supabase
          .from("alunos")
          .select("id, nome_completo")
          .eq("cpf", cleanCpf)
          .maybeSingle();

        if (checkError) throw checkError;
        if (existing && existing.id !== editingAluno?.id) {
          throw new Error(
            `Já existe um aluno cadastrado com este CPF: ${existing.nome_completo}`
          );
        }
      }

      const payload = {
        nome_completo: values.nome_completo,
        data_nascimento: values.data_nascimento,
        cpf: cleanCpf || null,
        telefone: values.telefone || null,
        endereco: values.endereco || null,
        responsavel_id: values.responsavel_id,
      };

      if (editingAluno) {
        const { error } = await supabase
          .from("alunos")
          .update(payload)
          .eq("id", editingAluno.id);
        if (error) {
          if (error.message?.includes("idx_alunos_cpf_unique")) {
            throw new Error("Já existe um aluno cadastrado com este CPF.");
          }
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("alunos")
          .insert([payload]);
        if (error) {
          if (error.message?.includes("idx_alunos_cpf_unique")) {
            throw new Error("Já existe um aluno cadastrado com este CPF.");
          }
          throw error;
        }
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

  const handleSubmit = (e: React.FormEvent) => {
    // This seems to be missing in the original Alunos.tsx or maybe it was onSubmit.
    // The previous Alunos.tsx used onSubmit from useForm.
  };

  const handleOpenTimeline = (aluno: any) => {
    setSelectedAlunoForTimeline(aluno);
    setTimelineOpen(true);
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
                        onClick={() => handleOpenTimeline(aluno)}
                        className="gap-1"
                      >
                        <CalendarClock className="h-3 w-3" />
                        Histórico
                      </Button>
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                {/* Seção: Dados Pessoais */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                      Dados Pessoais
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="nome_completo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-primary/80">
                          <User className="h-3.5 w-3.5" /> Nome Completo *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo do aluno" {...field} className="transition-all focus:ring-2 focus:ring-primary/20" />
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
                          <FormLabel className="flex items-center gap-2 text-primary/80">
                            <Calendar className="h-3.5 w-3.5" /> Data de Nascimento *
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="transition-all focus:ring-2 focus:ring-primary/20" />
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
                          <FormLabel className="flex items-center gap-2 text-primary/80">
                            <IdCard className="h-3.5 w-3.5" /> CPF
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000.000.000-00"
                              maxLength={14}
                              {...field}
                              value={field.value ? formatCPF(field.value) : ""}
                              onChange={(e) => {
                                const formatted = formatCPF(e.target.value);
                                field.onChange(unmaskCPF(formatted));
                              }}
                              className="transition-all focus:ring-2 focus:ring-primary/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Seção: Contato */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Phone className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                      Contato e Localização
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-primary/80">
                          <Phone className="h-3.5 w-3.5" /> Telefone
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} value={field.value || ""} className="transition-all focus:ring-2 focus:ring-primary/20" />
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
                        <FormLabel className="flex items-center gap-2 text-primary/80">
                          <MapPin className="h-3.5 w-3.5" /> Endereço
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Endereço completo" {...field} value={field.value || ""} className="transition-all focus:ring-2 focus:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Seção: Vínculo (Apenas Diretoria/Coordenação) */}
                {(user?.role === "direcao" || user?.role === "coordenacao") && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Users className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        Vínculo Familiar
                      </h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="responsavel_id"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center gap-2 text-primary/80 mb-2">
                            <User className="h-3.5 w-3.5" /> Responsável Legal *
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? profiles?.find(
                                      (profile) => profile.id === field.value
                                    )?.nome_completo || "Responsável selecionado"
                                    : "Buscar responsável..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Digite o nome..." />
                                <CommandList>
                                  <CommandEmpty>Nenhum perfil encontrado.</CommandEmpty>
                                  <CommandGroup>
                                    {profiles?.map((profile) => (
                                      <CommandItem
                                        value={profile.nome_completo}
                                        key={profile.id}
                                        onSelect={() => {
                                          form.setValue("responsavel_id", profile.id);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            profile.id === field.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span>{profile.nome_completo}</span>
                                          <span className="text-xs text-muted-foreground">{profile.email}</span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={saveMutation.isPending}
                    className="px-6"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                  >
                    {saveMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingAluno ? "Salvar Alterações" : "Cadastrar Aluno"}
                  </Button>
                </div>
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

        {/* Sheet do Histórico de Contatos */}
        <Sheet open={timelineOpen} onOpenChange={setTimelineOpen}>
          <SheetContent className="sm:max-w-[400px] w-full">
            <SheetHeader className="mb-4">
              <SheetTitle>Histórico de Contatos</SheetTitle>
              <SheetDescription>
                Registros de interações com {selectedAlunoForTimeline?.nome_completo}
              </SheetDescription>
            </SheetHeader>
            {selectedAlunoForTimeline && (
              <ContactTimeline alunoId={selectedAlunoForTimeline.id} />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
};

export default Alunos;
