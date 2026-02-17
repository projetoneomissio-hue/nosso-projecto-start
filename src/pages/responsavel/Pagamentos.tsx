import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2, DollarSign, AlertCircle, CreditCard, Wallet } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { ReciboPagamento } from "@/components/reports/ReciboPagamento";

const Pagamentos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [payingId, setPayingId] = useState<string | null>(null);

  // Handle cancel from Stripe (success redirects to dedicated page)
  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      toast({
        title: "Pagamento cancelado",
        description: "O pagamento foi cancelado. Você pode tentar novamente.",
        variant: "destructive",
      });
      setSearchParams({});
    }
  }, [searchParams, toast, setSearchParams]);

  // Mutation para pagar online
  const pagarOnlineMutation = useMutation({
    mutationFn: async (pagamentoId: string) => {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { pagamentoId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message,
        variant: "destructive",
      });
      setPayingId(null);
    },
  });

  const handlePagarOnline = (pagamentoId: string) => {
    setPayingId(pagamentoId);
    pagarOnlineMutation.mutate(pagamentoId);
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pagamentos</h1>
            <p className="text-muted-foreground mt-1">
              Histórico e mensalidades dos seus alunos
            </p>
          </div>
          {totalPendente > 0 && (
            <Button asChild>
              <Link to="/responsavel/registrar-pagamento">
                <CreditCard className="mr-2 h-4 w-4" />
                Registrar Pagamento
              </Link>
            </Button>
          )}
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
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              R${" "}
                              {parseFloat(pagamento.valor.toString()).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {(pagamento.status === "pendente" || pagamento.status === "atrasado") && (
                              <Button
                                onClick={() => handlePagarOnline(pagamento.id)}
                                disabled={payingId === pagamento.id}
                                size="sm"
                              >
                                {payingId === pagamento.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <Wallet className="h-4 w-4 mr-1" />
                                )}
                                Pagar Online
                              </Button>
                            )}
                            {pagamento.status === "pago" && (
                              <Button
                                variant="outline"
                                size="icon"
                                title="Baixar comprovante"
                                onClick={async () => {
                                  try {
                                    toast({
                                      title: "Gerando recibo...",
                                      description: "Aguarde enquanto preparamos o PDF."
                                    });

                                    const blob = await pdf(
                                      <ReciboPagamento pagamento={pagamento as any} />
                                    ).toBlob();

                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement("a");
                                    link.href = url;
                                    link.download = `recibo-${pagamento.id.slice(0, 8)}.pdf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                  } catch (error) {
                                    console.error("Erro ao gerar recibo:", error);
                                    toast({
                                      title: "Erro",
                                      description: "Não foi possível gerar o recibo.",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
