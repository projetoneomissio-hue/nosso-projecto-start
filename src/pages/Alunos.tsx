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
  AlertCircle,
  CheckCircle,
  Save,
  X,
  Briefcase,
  Heart,
  Activity,
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
  // Helper para renderizar valores pendentes com estilo
  const renderVal = (val: any, label: string = "Não informado") => {
    if (!val || val === "" || val === "---") {
      return <span className="text-muted-foreground/40 italic font-normal">{label}</span>;
    }
    return val;
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    bairro: "all",
    escola: "all",
    statusSaude: "all", // all, pne, cronica
    governanca: "all", // all, img_pendente, dec_pendente
  });

  // State Contact Timeline
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedAlunoForTimeline, setSelectedAlunoForTimeline] = useState<any>(null);
  const [fichaOpen, setFichaOpen] = useState(false);
  const [selectedAlunoForFicha, setSelectedAlunoForFicha] = useState<any>(null);

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
          responsavel:profiles!alunos_responsavel_id_fkey(nome_completo, email),
          anamneses(*)
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

  const handleOpenFicha = (aluno: any) => {
    setSelectedAlunoForFicha(aluno);
    setFichaOpen(true);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  const filteredAlunos = alunos?.filter((aluno) => {
    const matchesSearch = aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.cpf?.includes(searchTerm) ||
      aluno.bairro?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBairro = activeFilters.bairro === "all" || aluno.bairro === activeFilters.bairro;
    const matchesEscola = activeFilters.escola === "all" || aluno.escola === activeFilters.escola;

    const anamnese = aluno.anamneses?.[0];
    const matchesSaude = activeFilters.statusSaude === "all" ||
      (activeFilters.statusSaude === "pne" && anamnese?.is_pne) ||
      (activeFilters.statusSaude === "cronica" && anamnese?.doenca_cronica);

    const matchesGov = activeFilters.governanca === "all" ||
      (activeFilters.governanca === "img_pendente" && !aluno.autoriza_imagem) ||
      (activeFilters.governanca === "dec_pendente" && !aluno.declaracao_assinada);

    return matchesSearch && matchesBairro && matchesEscola && matchesSaude && matchesGov;
  });

  const uniqueBairros = Array.from(new Set(alunos?.map(a => a.bairro).filter(Boolean)));
  const uniqueEscolas = Array.from(new Set(alunos?.map(a => a.escola).filter(Boolean)));

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

        <div className="flex flex-col gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno por nome, CPF ou bairro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-background/50 backdrop-blur-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={activeFilters.bairro} onValueChange={(v) => setActiveFilters({ ...activeFilters, bairro: v })}>
              <SelectTrigger className="w-fit min-w-[140px] h-9 bg-background/50">
                <SelectValue placeholder="Bairro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Bairros</SelectItem>
                {uniqueBairros.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={activeFilters.escola} onValueChange={(v) => setActiveFilters({ ...activeFilters, escola: v })}>
              <SelectTrigger className="w-fit min-w-[140px] h-9 bg-background/50">
                <SelectValue placeholder="Escola" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Escolas</SelectItem>
                {uniqueEscolas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={activeFilters.statusSaude} onValueChange={(v) => setActiveFilters({ ...activeFilters, statusSaude: v })}>
              <SelectTrigger className="w-fit min-w-[140px] h-9 bg-background/50 transition-colors data-[state=open]:border-primary/50">
                <SelectValue placeholder="Saúde" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status de Saúde</SelectItem>
                <SelectItem value="pne" className="text-red-600 font-medium">Somente PNE</SelectItem>
                <SelectItem value="cronica" className="text-orange-600 font-medium">Doença Crônica</SelectItem>
              </SelectContent>
            </Select>

            <Select value={activeFilters.governanca} onValueChange={(v) => setActiveFilters({ ...activeFilters, governanca: v })}>
              <SelectTrigger className="w-fit min-w-[140px] h-9 bg-background/50">
                <SelectValue placeholder="Governança" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Governança</SelectItem>
                <SelectItem value="img_pendente">Sem Autoriza. Imagem</SelectItem>
                <SelectItem value="dec_pendente">Sem Declaração Assinada</SelectItem>
              </SelectContent>
            </Select>

            {(activeFilters.bairro !== "all" || activeFilters.escola !== "all" || activeFilters.statusSaude !== "all" || activeFilters.governanca !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilters({ bairro: "all", escola: "all", statusSaude: "all", governanca: "all" })}
                className="h-9 text-xs text-muted-foreground hover:text-primary"
              >
                Limpar Filtros
              </Button>
            )}
          </div>
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
                    className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 border rounded-lg gap-4 bg-card/50 hover:bg-card transition-colors shadow-sm group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border-2 border-primary/20">
                          {aluno.nome_completo.charAt(0)}
                        </div>
                        {aluno.anamneses?.[0]?.is_pne && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-background animate-pulse" title="PNE">
                            !
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground truncate">{aluno.nome_completo}</h3>
                          <span className="text-[10px] font-medium bg-muted px-2 py-0.5 rounded-full text-muted-foreground uppercase tracking-wider shrink-0">
                            {aluno.serie_ano || "Série não inf."}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {aluno.bairro || "Bairro não inf."}</span>
                          <span className="flex items-center gap-1"><IdCard className="h-3 w-3" /> {aluno.rg || aluno.cpf || "Sem doc."}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenTimeline(aluno)}
                        className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
                        title="Histórico de Contatos"
                      >
                        <CalendarClock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenFicha(aluno)}
                        className="h-9 px-3 gap-2 font-medium"
                      >
                        <IdCard className="h-4 w-4" />
                        Ficha
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(aluno)}
                        className="h-9 w-9 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(aluno.id)}
                        className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
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

        {/* Dialog para criar/editar - Premium Redesign */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto p-0 bg-background/95 backdrop-blur-xl border border-primary/10 shadow-2xl overflow-hidden">
            <div className="relative h-24 bg-gradient-to-r from-neomissio-primary/10 to-primary/5 flex items-center px-8">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />
              <div className="relative">
                <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                  {editingAluno ? "Editar Aluno" : "Novo Aluno"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs mt-1">
                  {editingAluno
                    ? "Atualize as informações oficiais deste registro."
                    : "Preencha os dados necessários para o novo cadastro acadêmico."}
                </DialogDescription>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-8 py-8 space-y-10">
                {/* Seção: Dados Pessoais */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-primary/70">
                      Identificação Pessoal
                    </h3>
                  </div>

                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="nome_completo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                            <User className="h-3 w-3" /> Nome Completo *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Digite o nome completo"
                              {...field}
                              className="h-11 bg-muted/20 border-white/5 focus:border-primary/30 transition-all rounded-xl shadow-inner-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="data_nascimento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                              <Calendar className="h-3 w-3" /> Nascimento *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                className="h-11 bg-muted/20 border-white/5 focus:border-primary/30 transition-all rounded-xl"
                              />
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
                            <FormLabel className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                              <IdCard className="h-3 w-3" /> CPF
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
                                className="h-11 bg-muted/20 border-white/5 focus:border-primary/30 transition-all rounded-xl"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Contato */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                    <Phone className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-primary/70">
                      Contato & Endereço
                    </h3>
                  </div>

                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                            <Phone className="h-3 w-3" /> Telefone
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(00) 00000-0000"
                              {...field}
                              value={field.value || ""}
                              className="h-11 bg-muted/20 border-white/5 focus:border-primary/30 transition-all rounded-xl"
                            />
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
                          <FormLabel className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                            <MapPin className="h-3 w-3" /> Endereço Completo
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Rua, Número, Complemento"
                              {...field}
                              value={field.value || ""}
                              className="h-11 bg-muted/20 border-white/5 focus:border-primary/30 transition-all rounded-xl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Seção: Vínculo (Apenas Diretoria/Coordenação) */}
                {(user?.role === "direcao" || user?.role === "coordenacao") && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-primary/70">
                        Vínculo Institucional
                      </h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="responsavel_id"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                            <User className="h-3 w-3" /> Responsável Legal *
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full h-11 justify-between font-normal bg-muted/20 border-white/5 rounded-xl hover:bg-muted/30 transition-all",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? profiles?.find(
                                      (profile) => profile.id === field.value
                                    )?.nome_completo || "Responsável selecionado"
                                    : "Buscar ou selecionar responsável..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-primary" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-background/95 backdrop-blur-xl border-primary/10" align="start">
                              <Command>
                                <CommandInput placeholder="Digite o nome..." className="h-11 border-none focus:ring-0" />
                                <CommandList className="max-h-64">
                                  <CommandEmpty>Nenhum perfil encontrado.</CommandEmpty>
                                  <CommandGroup>
                                    {profiles?.map((profile) => (
                                      <CommandItem
                                        value={profile.nome_completo}
                                        key={profile.id}
                                        onSelect={() => {
                                          form.setValue("responsavel_id", profile.id);
                                        }}
                                        className="py-3 px-4 flex items-center gap-3 cursor-pointer hover:bg-primary/10"
                                      >
                                        <div className={cn(
                                          "flex items-center justify-center h-5 w-5 rounded-full border border-primary/20",
                                          profile.id === field.value ? "bg-primary text-primary-foreground" : "bg-transparent"
                                        )}>
                                          {profile.id === field.value && <Check className="h-3 w-3" />}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="font-medium truncate">{profile.nome_completo}</span>
                                          <span className="text-[10px] text-muted-foreground truncate uppercase tracking-widest">{profile.email}</span>
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

                <div className="flex justify-end gap-3 pt-8 pb-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCloseDialog}
                    disabled={saveMutation.isPending}
                    className="px-6 rounded-xl text-muted-foreground hover:text-white"
                  >
                    Descartar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="px-10 h-12 bg-neomissio-primary hover:bg-neomissio-primary/90 rounded-xl shadow-lg shadow-neomissio-primary/20 transition-all hover:scale-105 active:scale-95 font-bold"
                  >
                    {saveMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingAluno ? "Atualizar Aluno" : "Cadastrar Aluno"}
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

        {/* Sheet da Ficha Digital do Aluno (Audit 3.0+) - Premium Redesign */}
        <Sheet open={fichaOpen} onOpenChange={setFichaOpen}>
          <SheetContent className="sm:max-w-[650px] w-full p-0 overflow-y-auto bg-background/95 backdrop-blur-xl border-l-primary/10">
            {/* Header com Gradiente e Foto */}
            <div className="relative h-48 bg-gradient-to-br from-neomissio-primary/20 via-background to-background border-b border-primary/10">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
              <div className="absolute top-6 right-6">
                <Button variant="ghost" size="icon" onClick={() => setFichaOpen(false)} className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-white">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="absolute bottom-[-40px] left-8 flex items-end gap-6">
                <div className="h-32 w-32 rounded-3xl bg-gradient-to-tr from-neomissio-primary/40 to-primary/10 p-1 shadow-2xl backdrop-blur-md">
                  <div className="h-full w-full rounded-[22px] bg-background flex items-center justify-center border border-white/10">
                    {selectedAlunoForFicha?.foto_url ? (
                      <img src={selectedAlunoForFicha.foto_url} alt={selectedAlunoForFicha?.nome_completo} className="h-full w-full object-cover rounded-[22px]" />
                    ) : (
                      <span className="text-4xl font-bold text-primary">{selectedAlunoForFicha?.nome_completo?.charAt(0)}</span>
                    )}
                  </div>
                </div>
                <div className="pb-4">
                  <h2 className="text-3xl font-bold text-white tracking-tight">{selectedAlunoForFicha?.nome_completo}</h2>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                      {selectedAlunoForFicha?.serie_ano || "Série pendente"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" /> ID: {selectedAlunoForFicha?.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 pt-20 pb-12 space-y-10">
              {/* Grid de Dados Rápidos */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-muted/20 border border-white/5 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Idade</p>
                  <p className="text-lg font-bold text-foreground">{calculateAge(selectedAlunoForFicha?.data_nascimento)} anos</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 border border-white/5 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Bairro</p>
                  <p className="text-lg font-bold text-foreground truncate">{renderVal(selectedAlunoForFicha?.bairro, "Pendente")}</p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 border border-white/5 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Saúde</p>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("h-3 w-3 rounded-full", selectedAlunoForFicha?.anamneses?.[0]?.is_pne ? "bg-red-500 animate-pulse" : "bg-green-500")} />
                    <p className="text-xs font-bold">{selectedAlunoForFicha?.anamneses?.[0]?.is_pne ? "Alerta" : "Estável"}</p>
                  </div>
                </div>
              </div>

              {/* Seções de Detalhes */}
              <div className="space-y-8">
                {/* 1. Documentação e Contato */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                      <div className="p-1.5 rounded-lg bg-primary/10"><IdCard className="h-4 w-4" /></div>
                      Identificação & Contato
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6 p-6 rounded-3xl bg-muted/10 border border-white/5">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">CPF do Aluno</p>
                      <p className="font-semibold text-foreground text-sm">{renderVal(selectedAlunoForFicha?.cpf)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">RG do Aluno</p>
                      <p className="font-semibold text-foreground text-sm">{renderVal(selectedAlunoForFicha?.rg)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Telefone de Contato</p>
                      <p className="font-semibold text-foreground text-sm">{renderVal(selectedAlunoForFicha?.telefone)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Escola de Origem</p>
                      <p className="font-semibold text-foreground text-sm">{renderVal(selectedAlunoForFicha?.escola)}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-xs text-muted-foreground">Endereço Residencial</p>
                      <p className="font-semibold text-foreground text-sm">{renderVal(selectedAlunoForFicha?.endereco)}</p>
                    </div>
                  </div>
                </section>

                {/* 2. Responsável Legal (New Section) */}
                <section>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
                    <div className="p-1.5 rounded-lg bg-primary/10"><Users className="h-4 w-4" /></div>
                    Responsável Legal
                  </div>
                  <div className="p-6 rounded-3xl bg-muted/10 border border-white/5 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {renderVal(selectedAlunoForFicha?.responsavel?.nome_completo?.charAt(0), "?")}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-foreground">{renderVal(selectedAlunoForFicha?.responsavel?.nome_completo, "Não vinculado")}</p>
                        <p className="text-xs text-muted-foreground">{renderVal(selectedAlunoForFicha?.responsavel?.email, "Sem e-mail")}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Briefcase className="h-3 w-3" /> Profissão
                        </p>
                        <p className="text-sm font-medium">{renderVal(selectedAlunoForFicha?.profissao, "Não informada")}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Activity className="h-3 w-3" /> Grau de Parentesco
                        </p>
                        <p className="text-sm font-medium">{renderVal(selectedAlunoForFicha?.grau_parentesco, "Não informado")}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. Saúde e Alertas Críticos */}
                <section>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
                    <div className="p-1.5 rounded-lg bg-red-500/10"><Heart className="h-4 w-4 text-red-500" /></div>
                    Saúde & Alertas Críticos
                  </div>
                  <div className="space-y-4">
                    {selectedAlunoForFicha?.anamneses?.[0]?.is_pne && (
                      <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-100 flex gap-4">
                        <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wider opacity-70">Necessidades Especiais (PNE)</p>
                          <p className="text-sm leading-relaxed">{selectedAlunoForFicha.anamneses?.[0]?.pne_descricao}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-muted/10 border border-white/5 space-y-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5">
                          <Activity className="h-3 w-3" /> Alergias
                        </p>
                        <p className="text-sm font-medium">{renderVal(selectedAlunoForFicha?.anamneses?.[0]?.alergias, "Nenhuma")}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/10 border border-white/5 space-y-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5">
                          <Activity className="h-3 w-3" /> Doença Crônica
                        </p>
                        <p className="text-sm font-medium">{renderVal(selectedAlunoForFicha?.anamneses?.[0]?.doenca_cronica, "Nenhuma")}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/10 border border-white/5 space-y-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5">
                          <Activity className="h-3 w-3" /> Medicamentos
                        </p>
                        <p className="text-sm font-medium">{renderVal(selectedAlunoForFicha?.anamneses?.[0]?.medicamentos, "Nenhum")}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/10 border border-white/5 space-y-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5">
                          <Activity className="h-3 w-3" /> Tipo Sanguíneo
                        </p>
                        <p className="text-sm font-medium font-mono uppercase text-primary">{renderVal(selectedAlunoForFicha?.anamneses?.[0]?.tipo_sanguineo, "---")}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Governança e Compliance */}
                <section>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
                    <div className="p-1.5 rounded-lg bg-green-500/10"><CheckCircle className="h-4 w-4 text-green-500" /></div>
                    Governança & Compliance
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn(
                      "p-4 rounded-2xl border flex items-center justify-between transition-colors",
                      selectedAlunoForFicha?.autoriza_imagem ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                    )}>
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold opacity-60">Uso de Imagem</p>
                        <p className="text-sm font-semibold">{selectedAlunoForFicha?.autoriza_imagem ? "Autorizado" : "Negado"}</p>
                      </div>
                      {selectedAlunoForFicha?.autoriza_imagem ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
                    </div>

                    <div className={cn(
                      "p-4 rounded-2xl border flex items-center justify-between transition-colors",
                      selectedAlunoForFicha?.declaracao_assinada ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                    )}>
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold opacity-60">Declaração</p>
                        <p className="text-sm font-semibold">{selectedAlunoForFicha?.declaracao_assinada ? "Processada" : "Pendente"}</p>
                      </div>
                      {selectedAlunoForFicha?.declaracao_assinada ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
                    </div>
                  </div>
                </section>
              </div>

              {/* Ações de Auditoria */}
              <div className="flex gap-4 pt-6 border-t border-white/5">
                <Button variant="outline" className="flex-1 h-12 rounded-2xl border-primary/20 hover:bg-primary/5 text-primary font-bold gap-2" disabled>
                  <Save className="h-4 w-4" /> Exportar PDF
                </Button>
                <Button
                  className="flex-1 h-12 rounded-2xl bg-neomissio-primary hover:bg-neomissio-primary/90 font-bold gap-2 shadow-lg shadow-neomissio-primary/20"
                  onClick={() => handleOpenDialog(selectedAlunoForFicha)}
                >
                  <Pencil className="h-4 w-4" /> Editar Registro
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
};

export default Alunos;
