import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2, DollarSign, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Pagamentos = () => {
  const { user } = useAuth();

  // Fetch pagamentos do responsável
  const { data: pagamentos, isLoading } = useQuery({
    queryKey: ["pagamentos-responsavel", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Primeiro busca alunos do responsável
      const { data: alunosData, error: e1 } = await supabase
        .from("alunos")
        .select("id")
        .eq("responsavel_id", user.id);

      if (e1) throw e1;
      if (!alunosData || alunosData.length === 0) return [];

      const alunoIds = alunosData.map((a) => a.id);

      // Busca matrículas dos alunos
      const { data: matriculasData, error: e2 } = await supabase
        .from("matriculas")
        .select(`
          id,
          aluno_id,
          turma_id,
          alunos(nome_completo),
          turmas(nome, atividade_id, atividades(nome))
        `)
        .in("aluno_id", alunoIds);

      if (e2) throw e2;

      const matriculaIds = matriculasData?.map((m) => m.id) || [];
      if (matriculaIds.length === 0) return [];

      // Busca pagamentos
      const { data, error } = await supabase
        .from("pagamentos")
        .select("*")
        .in("matricula_id", matriculaIds)
        .order("data_vencimento", { ascending: false });

      if (error) throw error;

      // Mapeia pagamentos com dados das matrículas
      return data?.map((pag) => {
        const matricula = matriculasData?.find((m) => m.id === pag.matricula_id);
        return {
          ...pag,
          matricula,
        };
      }) || [];
    },
    enabled: !!user,
  });

  // Calcula totais
  const totalPendente = pagamentos
    ?.filter((p) => p.status === "pendente" || p.status === "atrasado")
    .reduce((acc, p) => acc + parseFloat(p.valor.toString()), 0) || 0;

  const totalPago = pagamentos
    ?.filter((p) => p.status === "pago")
    .reduce((acc, p) => acc + parseFloat(p.valor.toString()), 0) || 0;

  const getStatusBadge = (status: string, dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);

    if (status === "pago") {
      return <Badge variant="default">Pago</Badge>;
    } else if (status === "cancelado") {
      return <Badge variant="secondary">Cancelado</Badge>;
    } else if (vencimento < hoje) {
      return <Badge variant="destructive">Atrasado</Badge>;
    } else {
      return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const isDueOrOverdue = (status: string, dataVencimento: string) => {
    if (status === "pago" || status === "cancelado") return false;
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diasAteVencimento <= 7;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pagamentos</h1>
          <p className="text-muted-foreground mt-1">
            Histórico e mensalidades dos seus alunos
          </p>
        </div>

        {/* Resumo */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Pendente</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {pagamentos?.filter((p) => p.status === "pendente" || p.status === "atrasado").length || 0} mensalidades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {pagamentos?.filter((p) => p.status === "pago").length || 0} mensalidades pagas
              </p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pagamentos && pagamentos.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Mensalidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagamentos.map((pagamento) => (
                  <Card
                    key={pagamento.id}
                    className={
                      isDueOrOverdue(pagamento.status, pagamento.data_vencimento)
                        ? "border-destructive"
                        : ""
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              {pagamento.matricula?.alunos?.nome_completo || "N/A"}
                            </h3>
                            {getStatusBadge(pagamento.status, pagamento.data_vencimento)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {pagamento.matricula?.turmas?.atividades?.nome || "N/A"} -{" "}
                            {pagamento.matricula?.turmas?.nome || "N/A"}
                          </p>
                          <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            <p>
                              Vencimento:{" "}
                              {format(new Date(pagamento.data_vencimento), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </p>
                            {pagamento.data_pagamento && (
                              <p>
                                Pago em:{" "}
                                {format(new Date(pagamento.data_pagamento), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </p>
                            )}
                            {pagamento.forma_pagamento && (
                              <p>Forma: {pagamento.forma_pagamento}</p>
                            )}
                          </div>
                          {pagamento.observacoes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              Obs: {pagamento.observacoes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              R${" "}
                              {parseFloat(pagamento.valor.toString()).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          {pagamento.status === "pago" && (
                            <Button variant="outline" size="icon" title="Baixar comprovante">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                Nenhum pagamento registrado ainda.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Pagamentos;
