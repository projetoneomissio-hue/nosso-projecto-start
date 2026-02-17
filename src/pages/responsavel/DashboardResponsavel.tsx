import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  FileText,
  DollarSign,
  Calendar,
  Loader2,
  UserPlus,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Clock,
  Megaphone,
  Edit2,
  Camera
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAlunoMutations } from "@/hooks/useAlunos";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCPF, unmaskCPF, validateCPF } from "@/utils/cpf";
import { useState } from "react";

import { OnboardingResponsavel } from "@/components/responsavel/OnboardingResponsavel";

const DashboardResponsavel = () => {
  const { user } = useAuth();
  const { saveMutation } = useAlunoMutations();

  // State for Edit
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    data_nascimento: "",
    cpf: "",
    telefone: "",
    endereco: "",
    alergias: "",
    medicamentos: "",
    observacoes: "",
    foto_url: null as string | null,
  });
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    setFormData({ ...formData, cpf: formatted });
    setCpfError(null);

    const clean = unmaskCPF(formatted);
    if (clean.length === 11 && !validateCPF(clean)) {
      setCpfError("CPF inválido");
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, foto_url: data.publicUrl }));
    } catch (error: any) {
      console.error("Erro no upload:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cpfError) return;
    saveMutation.mutate(
      { id: editingAluno?.id, data: formData },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingAluno(null);
          setFormData({
            nome: "", data_nascimento: "", cpf: "", telefone: "", endereco: "",
            alergias: "", medicamentos: "", observacoes: "", foto_url: null
          });
        },
      }
    );
  };

  // Fetch alunos do responsável
  const { data: alunos, isLoading: loadingAlunos } = useQuery({
    queryKey: ["dashboard-alunos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("alunos")
        .select("id, nome_completo, data_nascimento, cpf, telefone, endereco, alergias, medicamentos, observacoes, foto_url")
        .eq("responsavel_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch matrículas dos alunos
  const { data: matriculas, isLoading: loadingMatriculas } = useQuery({
    queryKey: ["dashboard-matriculas", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("matriculas")
        .select(`
          id,
          status,
          data_inicio,
          aluno:alunos!inner(id, nome_completo, responsavel_id),
          turma:turmas(
            nome,
            horario,
            dias_semana,
            atividade:atividades(nome)
          )
        `)
        .eq("alunos.responsavel_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch pagamentos pendentes
  const { data: pagamentos, isLoading: loadingPagamentos } = useQuery({
    queryKey: ["dashboard-pagamentos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pagamentos")
        .select(`
          id,
          valor,
          data_vencimento,
          status,
          matricula:matriculas!inner(
            aluno:alunos!inner(nome_completo, responsavel_id),
            turma:turmas(atividade:atividades(nome))
          )
        `)
        .eq("matriculas.alunos.responsavel_id", user.id)
        .eq("status", "pendente")
        .order("data_vencimento", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const totalAlunos = alunos?.length || 0;
  const matriculasPendentes = matriculas?.filter(m => m.status === "pendente").length || 0;
  const matriculasAtivas = matriculas?.filter(m => m.status === "ativa").length || 0;
  const totalPagamentosPendentes = pagamentos?.length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "ativa":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20"><CheckCircle2 className="w-3 h-3 mr-1" />Ativa</Badge>;
      case "cancelada":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isVencidoOuProximo = (dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    return isBefore(vencimento, addDays(hoje, 7));
  };

  if (loadingAlunos || loadingMatriculas || loadingPagamentos) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // Show Onboarding if no students found
  if (alunos && alunos.length === 0) {
    return (
      <DashboardLayout>
        <OnboardingResponsavel />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Olá, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe os alunos, matrículas e pagamentos
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Alunos Cadastrados"
            value={totalAlunos}
            icon={Users}
            description="Total de dependentes"
          />
          <DashboardCard
            title="Matrículas Ativas"
            value={matriculasAtivas}
            icon={CheckCircle2}
            description="Inscrições aprovadas"
          />
          <DashboardCard
            title="Matrículas Pendentes"
            value={matriculasPendentes}
            icon={Clock}
            description="Aguardando aprovação"
          />
          <DashboardCard
            title="Pagamentos Pendentes"
            value={totalPagamentosPendentes}
            icon={DollarSign}
            description="A vencer ou vencidos"
          />
        </div>

        {/* Mural de Avisos */}
        <MuralAvisos />

        {/* Ações Rápidas */}
        {totalAlunos === 0 && (
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <UserPlus className="h-12 w-12 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Comece cadastrando seu primeiro aluno</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Para solicitar matrículas, você precisa primeiro cadastrar um aluno (filho/dependente).
                  </p>
                </div>
                <Button asChild>
                  <Link to="/responsavel/cadastrar-aluno">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Cadastrar Aluno
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Meus Alunos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Meus Alunos</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/responsavel/cadastrar-aluno">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo Aluno
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {alunos && alunos.length > 0 ? (
                alunos.map((aluno) => (
                  <div key={aluno.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{aluno.nome_completo}</p>
                        <p className="text-sm text-muted-foreground">
                          Nascimento: {format(new Date(aluno.data_nascimento), "dd/MM/yyyy")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingAluno(aluno);
                        setFormData({
                          nome: aluno.nome_completo,
                          data_nascimento: aluno.data_nascimento,
                          cpf: formatCPF(aluno.cpf || ""),
                          telefone: aluno.telefone || "",
                          endereco: aluno.endereco || "",
                          alergias: (aluno as any).alergias || "",
                          medicamentos: (aluno as any).medicamentos || "",
                          observacoes: (aluno as any).observacoes || "",
                          foto_url: (aluno as any).foto_url || null,
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>

                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum aluno cadastrado
                </p>
              )}
            </CardContent>
          </Card>

          {/* Matrículas Recentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Matrículas</CardTitle>
              {totalAlunos > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/responsavel/nova-matricula">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Nova Matrícula
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {matriculas && matriculas.length > 0 ? (
                matriculas.slice(0, 5).map((matricula) => (
                  <div key={matricula.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{matricula.aluno?.nome_completo}</p>
                      <p className="text-sm text-muted-foreground">
                        {matricula.turma?.atividade?.nome} - {matricula.turma?.nome}
                      </p>
                    </div>
                    {getStatusBadge(matricula.status)}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Nenhuma matrícula encontrada</p>
                  {totalAlunos > 0 && (
                    <Button variant="link" asChild className="mt-2">
                      <Link to="/responsavel/nova-matricula">Solicitar primeira matrícula</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Próximos Pagamentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Próximos Pagamentos</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/responsavel/pagamentos">Ver Todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pagamentos && pagamentos.length > 0 ? (
              <div className="space-y-3">
                {pagamentos.map((pag) => {
                  const vencido = isBefore(new Date(pag.data_vencimento), new Date());
                  const proximo = isVencidoOuProximo(pag.data_vencimento);

                  return (
                    <div key={pag.id} className={`flex items-center justify-between p-4 rounded-lg ${vencido ? 'bg-destructive/10 border border-destructive/20' : proximo ? 'bg-warning/10 border border-warning/20' : 'bg-muted/50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${vencido ? 'bg-destructive/20' : proximo ? 'bg-warning/20' : 'bg-muted'}`}>
                          {vencido ? (
                            <AlertCircle className="h-5 w-5 text-destructive" />
                          ) : (
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{pag.matricula?.aluno?.nome_completo}</p>
                          <p className="text-sm text-muted-foreground">
                            {pag.matricula?.turma?.atividade?.nome}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          R$ {parseFloat(pag.valor.toString()).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-sm ${vencido ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {vencido ? 'Vencido em ' : 'Vence em '}
                          {format(new Date(pag.data_vencimento), "dd/MM/yyyy")}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {totalPagamentosPendentes > 0 && (
                  <div className="pt-2">
                    <Button className="w-full" asChild>
                      <Link to="/responsavel/registrar-pagamento">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Registrar Pagamento
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum pagamento pendente
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">

            {/* Foto Upload UI */}
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative group cursor-pointer w-24 h-24">
                <Avatar className="w-24 h-24 border-2 border-white shadow-md">
                  {formData.foto_url && <AvatarImage src={formData.foto_url} className="object-cover" />}
                  <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                    {(formData.nome?.[0] || "A").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="edit-photo-upload"
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full cursor-pointer backdrop-blur-sm"
                >
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                </label>
                <Input
                  id="edit-photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  placeholder="000.000.000-00"
                />
                {cpfError && <p className="text-sm text-red-500">{cpfError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              {/* Health Fields */}
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="alergias">Alergias</Label>
                <Input
                  id="alergias"
                  value={formData.alergias}
                  onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                  placeholder="Ex: Amendoim, Penicilina"
                />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="medicamentos">Medicamentos Contínuos</Label>
                <Input
                  id="medicamentos"
                  value={formData.medicamentos}
                  onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                  placeholder="Ex: Ritalina 10mg"
                />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="observacoes">Observações Gerais</Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Outras informações importantes"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

const MuralAvisos = () => {
  const { user } = useAuth();

  const { data: comunicados = [], isLoading } = useQuery({
    queryKey: ["mural-comunicados", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("comunicados")
        .select(`
          id,
          titulo,
          mensagem,
          tipo,
          created_at,
          turmas (nome)
        `)
        .eq("status", "enviado")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Mural de Avisos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (comunicados.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Mural de Avisos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {comunicados.map((comunicado: any) => (
          <div
            key={comunicado.id}
            className="p-4 rounded-lg bg-background border shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground truncate">
                    {comunicado.titulo}
                  </h4>
                  {comunicado.tipo === "turma" && comunicado.turmas?.nome && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {comunicado.turmas.nome}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {comunicado.mensagem}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(comunicado.created_at), "dd/MM", { locale: ptBR })}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const FrequenciaCard = () => {
  const { user } = useAuth();

  const { data: presencas } = useQuery({
    queryKey: ["dashboard-presencas", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get children IDs first
      const { data: alunos } = await supabase.from("alunos").select("id").eq("responsavel_id", user.id);
      if (!alunos?.length) return [];

      const alunoIds = alunos.map(a => a.id);

      // Get matriculas for these children
      const { data: matriculas } = await supabase
        .from("matriculas")
        .select("id, aluno_id")
        .in("aluno_id", alunoIds);

      if (!matriculas?.length) return [];

      const matriculaIds = matriculas.map(m => m.id);

      // Get recent attendance for these matriculas using presencas table
      const { data, error } = await supabase
        .from("presencas")
        .select(`
           data,
           presente,
           observacao,
           matricula_id
         `)
        .in("matricula_id", matriculaIds)
        .order("data", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Últimas Presenças
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {presencas && presencas.length > 0 ? (
          presencas.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(p.data), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                {p.presente ? (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Presente</Badge>
                ) : (
                  <Badge variant="destructive">Falta</Badge>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum registro recente.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardResponsavel;
