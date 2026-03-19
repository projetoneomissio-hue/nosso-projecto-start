import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, UserPlus, ClipboardList, Loader2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useUnidade } from "@/contexts/UnidadeContext";

const DashboardSecretaria = () => {
  const { currentUnidade } = useUnidade();

  // Total de alunos
  const { data: totalAlunos, isLoading: loadingAlunos } = useQuery({
    queryKey: ["secretaria-total-alunos"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("alunos")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Matrículas pendentes
  const { data: matriculasPendentes, isLoading: loadingPendentes } = useQuery({
    queryKey: ["secretaria-matriculas-pendentes"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("matriculas")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");
      if (error) throw error;
      return count || 0;
    },
  });

  // Alunos cadastrados hoje
  const { data: cadastrosHoje, isLoading: loadingHoje } = useQuery({
    queryKey: ["secretaria-cadastros-hoje"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const { count, error } = await supabase
        .from("alunos")
        .select("*", { count: "exact", head: true })
        .gte("created_at", hoje);
      if (error) throw error;
      return count || 0;
    },
  });

  // Atividades ativas
  const { data: atividadesAtivas, isLoading: loadingAtividades } = useQuery({
    queryKey: ["secretaria-atividades-ativas"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("atividades")
        .select("*", { count: "exact", head: true })
        .eq("ativa", true);
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Secretaria</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao painel de atendimento
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/secretaria/cadastrar-aluno" className="group">
            <Card className="h-full border-2 border-dashed border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/10 transition-all cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">Cadastrar Aluno</h3>
                  <p className="text-sm text-muted-foreground">Registrar novo aluno no sistema</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/secretaria/nova-matricula" className="group">
            <Card className="h-full border-2 border-dashed border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60 hover:bg-blue-500/10 transition-all cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-7 w-7 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">Nova Matrícula</h3>
                  <p className="text-sm text-muted-foreground">Solicitar matrícula pendente</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Alunos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAlunos ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold text-foreground">{totalAlunos}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPendentes ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold text-orange-500">{matriculasPendentes}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Matrículas aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Cadastros Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHoje ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold text-green-500">{cadastrosHoje}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAtividades ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold text-foreground">{atividadesAtivas}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Modalidades abertas</p>
            </CardContent>
          </Card>
        </div>

        {/* Info banner */}
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <ClipboardList className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Sobre as matrículas</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Todas as matrículas criadas ficam como <strong>pendente</strong> e precisam ser aprovadas pela diretoria.
                Casos de alunos com necessidades especiais (PNE) são sinalizados automaticamente na ficha.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardSecretaria;
