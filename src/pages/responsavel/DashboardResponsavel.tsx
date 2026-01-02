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
  Megaphone
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const DashboardResponsavel = () => {
  const { user } = useAuth();

  // Fetch alunos do responsável
  const { data: alunos, isLoading: loadingAlunos } = useQuery({
    queryKey: ["dashboard-alunos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("alunos")
        .select("id, nome_completo, data_nascimento")
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
    </DashboardLayout>
  );
};

const MuralAvisos = () => {
  // Comunicados table doesn't exist yet - show placeholder
  return null;
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
