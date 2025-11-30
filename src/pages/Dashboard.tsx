import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { Users, GraduationCap, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch total de alunos
  const { data: totalAlunos } = useQuery({
    queryKey: ["dashboard-total-alunos"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("alunos")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch atividades ativas
  const { data: atividadesAtivas } = useQuery({
    queryKey: ["dashboard-atividades-ativas"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("atividades")
        .select("*", { count: "exact", head: true })
        .eq("ativa", true);
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch receita mensal (pagamentos pagos do mês atual)
  const { data: receitaMensal } = useQuery({
    queryKey: ["dashboard-receita-mensal"],
    queryFn: async () => {
      const hoje = new Date();
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("pagamentos")
        .select("valor")
        .eq("status", "pago")
        .gte("data_pagamento", primeiroDia.toISOString())
        .lte("data_pagamento", ultimoDia.toISOString());

      if (error) throw error;
      const total = data?.reduce((acc, p) => acc + parseFloat(p.valor.toString()), 0) || 0;
      return total;
    },
  });

  // Fetch taxa de ocupação
  const { data: taxaOcupacao } = useQuery({
    queryKey: ["dashboard-taxa-ocupacao"],
    queryFn: async () => {
      const { data: turmas, error } = await supabase
        .from("turmas")
        .select(`
          capacidade_maxima,
          matriculas(count)
        `)
        .eq("ativa", true);

      if (error) throw error;
      
      const capacidadeTotal = turmas?.reduce((acc, t) => acc + t.capacidade_maxima, 0) || 0;
      const alunosMatriculados = turmas?.reduce((acc, t) => acc + (t.matriculas?.[0]?.count || 0), 0) || 0;
      
      return capacidadeTotal > 0 ? Math.round((alunosMatriculados / capacidadeTotal) * 100) : 0;
    },
  });

  // Fetch atividades populares
  const { data: atividadesPopulares, isLoading: loadingAtividades } = useQuery({
    queryKey: ["dashboard-atividades-populares"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select(`
          nome,
          turmas(
            matriculas(count)
          )
        `)
        .eq("ativa", true)
        .limit(4);

      if (error) throw error;
      
      const result = data?.map((ativ) => ({
        nome: ativ.nome,
        alunos: ativ.turmas?.reduce((acc, t) => acc + (t.matriculas?.[0]?.count || 0), 0) || 0,
      }))
      .sort((a, b) => b.alunos - a.alunos)
      .slice(0, 4);

      return result || [];
    },
  });

  // Fetch status de pagamentos
  const { data: statusPagamentos, isLoading: loadingPagamentos } = useQuery({
    queryKey: ["dashboard-pagamentos-status"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const seteDiasDepois = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const { count: vencidos, error: e1 } = await supabase
        .from("pagamentos")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente")
        .lt("data_vencimento", hoje);

      const { count: vencemEmBreve, error: e2 } = await supabase
        .from("pagamentos")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente")
        .gte("data_vencimento", hoje)
        .lte("data_vencimento", seteDiasDepois);

      const { count: emDia, error: e3 } = await supabase
        .from("pagamentos")
        .select("*", { count: "exact", head: true })
        .eq("status", "pago");

      if (e1 || e2 || e3) throw e1 || e2 || e3;

      return {
        vencidos: vencidos || 0,
        vencemEmBreve: vencemEmBreve || 0,
        emDia: emDia || 0,
      };
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao sistema de gestão Neo Missio
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Total de Alunos"
            value={totalAlunos?.toString() || "0"}
            icon={Users}
            description="Alunos cadastrados"
          />
          <DashboardCard
            title="Atividades Ativas"
            value={atividadesAtivas?.toString() || "0"}
            icon={GraduationCap}
            description="Modalidades oferecidas"
          />
          <DashboardCard
            title="Receita Mensal"
            value={`R$ ${receitaMensal?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00"}`}
            icon={DollarSign}
            description="Pagamentos recebidos"
          />
          <DashboardCard
            title="Taxa de Ocupação"
            value={`${taxaOcupacao || 0}%`}
            icon={TrendingUp}
            description="Capacidade utilizada"
          />
        </div>

        {/* Quick Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atividades Populares</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingAtividades ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : atividadesPopulares && atividadesPopulares.length > 0 ? (
                atividadesPopulares.map((ativ) => (
                  <div key={ativ.nome} className="flex justify-between items-center">
                    <span className="text-sm text-foreground">{ativ.nome}</span>
                    <span className="text-sm font-medium text-primary">
                      {ativ.alunos} alunos
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade cadastrada
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pagamentos Pendentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingPagamentos ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : statusPagamentos ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Vencidos</span>
                    <span className="text-sm font-medium text-destructive">
                      {statusPagamentos.vencidos}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Vencem em 7 dias</span>
                    <span className="text-sm font-medium text-warning">
                      {statusPagamentos.vencemEmBreve}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Em dia</span>
                    <span className="text-sm font-medium text-success">
                      {statusPagamentos.emDia}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sem dados de pagamentos
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visão Geral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Alunos Ativos</span>
                <span className="text-sm font-medium text-primary">
                  {totalAlunos || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Turmas Abertas</span>
                <span className="text-sm font-medium text-primary">
                  {atividadesAtivas || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Taxa de Ocupação</span>
                <span className="text-sm font-medium text-primary">
                  {taxaOcupacao || 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
