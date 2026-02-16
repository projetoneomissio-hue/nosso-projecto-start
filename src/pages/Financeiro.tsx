import { useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  PlusCircle,
  Download,
  Calendar,
  Users,
  Loader2,
  Mail,
  Send
} from "lucide-react";
import { useReceitaMensal, useDespesasMensal, useInadimplencia, useReceitaPorAtividade, useReceitaMeses, useUltimosPagamentos, useCustosRecentes, useInadimplentes } from "@/hooks/useFinanceiro";
import { financeiroService } from "@/services/financeiro.service";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/utils/error-handler";
import { pdf } from "@react-pdf/renderer";
import { RelatorioFinanceiro } from "@/components/reports/RelatorioFinanceiro";
import { NovaDespesaDialog } from "@/components/financeiro/NovaDespesaDialog";
import { format } from "date-fns";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const Financeiro = () => {
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: receitaMensal, isLoading: loadingReceita } = useReceitaMensal();

  const { data: receitaPorAtividade, isLoading: loadingAtividade } = useReceitaPorAtividade();

  const { data: inadimplencia, isLoading: loadingInadimplencia } = useInadimplencia();

  const { data: receitaMeses, isLoading: loadingMeses } = useReceitaMeses(6);

  const { data: despesas, isLoading: loadingDespesas } = useDespesasMensal();

  const lucroLiquido = (receitaMensal || 0) - (despesas?.total || 0);
  const margemLucro = receitaMensal ? ((lucroLiquido / receitaMensal) * 100).toFixed(1) : 0;

  const exportarPDF = async () => {
    try {
      toast({
        title: "Gerando relatório...",
        description: "Buscando dados e gerando PDF.",
      });

      const { data, periodo } = await financeiroService.fetchDadosPDF();

      // Transform data to match RelatorioFinanceiro interface
      const transacoes = data.map((item: any) => ({
        id: item.id,
        descricao: item.descricao,
        valor: item.valor,
        tipo: item.tipo,
        data_vencimento: item.data_vencimento || item.created_at, // Fallback if data_vencimento missing
        categoria: item.categoria,
        status: item.status
      }));

      // Generate PDF
      const blob = await pdf(
        <RelatorioFinanceiro
          transacoes={transacoes}
          periodo={periodo}
          tipo="geral"
        />
      ).toBlob();

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-financeiro-${format(new Date(), "MM-yyyy")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Relatório baixado!",
        description: "O PDF foi gerado com sucesso.",
      });

    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      handleError(error, "Erro ao gerar PDF");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground mt-1">
              Controle financeiro completo do projeto
            </p>
          </div>
          <div className="flex gap-2">
            <NovaDespesaDialog />
            <Button onClick={exportarPDF} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div ref={reportRef} className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all hover:shadow-lg border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita Mensal
                </CardTitle>
                <DollarSign className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                {loadingReceita ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-3xl font-bold text-foreground">
                    R$ {receitaMensal?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Total recebido este mês</p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Despesas Mensais
                </CardTitle>
                <TrendingDown className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                {loadingDespesas ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-3xl font-bold text-foreground">
                    R$ {despesas?.total?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Custos fixos e salários</p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saldo Operacional
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                {loadingReceita || loadingDespesas ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className={cn(
                    "text-3xl font-bold",
                    (receitaMensal - (despesas?.total || 0)) >= 0 ? "text-foreground" : "text-destructive"
                  )}>
                    R$ {(receitaMensal - (despesas?.total || 0))?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Resultado do mês</p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg border-l-4 border-l-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inadimplência
                </CardTitle>
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                {loadingInadimplencia ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-3xl font-bold text-destructive">
                    R$ {inadimplencia?.valor?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {inadimplencia?.quantidade} pagamentos em atraso
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receita dos Últimos 6 Meses</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMeses ? (
                  <div className="flex flex-col gap-4">
                    <Skeleton className="h-[300px] w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={receitaMeses}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="mes" />
                      <YAxis
                        tickFormatter={(value) =>
                          `R$ ${value.toLocaleString("pt-BR", { notation: "compact" })}`
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                          "Receita",
                        ]}
                      />
                      <Bar dataKey="receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receita por Atividade</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAtividade ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Skeleton className="h-48 w-48 rounded-full" />
                  </div>
                ) : Array.isArray(receitaPorAtividade) && receitaPorAtividade.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={receitaPorAtividade}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.nome}: R$ ${entry.valor.toFixed(0)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="valor"
                      >
                        {receitaPorAtividade.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                          "Receita"
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Sem dados de atividades
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detalhamento */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receitas por Categoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mensalidades (Pagos)</span>
                  <span className="font-medium">
                    R$ {(receitaMensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {despesas && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Salários</span>
                      <span className="font-medium">
                        R$ {despesas.salarios.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Custos do Prédio</span>
                      <span className="font-medium">
                        R$ {despesas.custos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Inadimplencia Table */}
          <Card className="col-span-full border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Pagamentos em Atraso (Inadimplência)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InadimplenciaTable />
            </CardContent>
          </Card>

          {/* Recent Expenses Table */}
          <Card>
            <CardHeader>
              <CardTitle>Despesas Recentes (Custos do Prédio)</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentExpensesTable />
            </CardContent>
          </Card>

          {/* Recent Payments Table */}
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Últimos Pagamentos Recebidos</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentPaymentsTable />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Component for Recent Payments Table
const RecentPaymentsTable = () => {
  const { data: ultimosPagamentos, isLoading } = useUltimosPagamentos(10);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ultimosPagamentos?.length) {
    return <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento recente encontrado.</p>;
  }

  return (
    <div className="relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm text-left">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Aluno</th>
            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Atividade</th>
            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Data</th>
            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Valor</th>
            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Status</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {ultimosPagamentos.map((pagamento: any) => (
            <tr key={pagamento.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <td className="p-4 align-middle font-medium">{pagamento.matricula?.aluno?.nome_completo || "Desconhecido"}</td>
              <td className="p-4 align-middle">{pagamento.matricula?.turma?.atividade?.nome || "-"}</td>
              <td className="p-4 align-middle">
                {pagamento.data_pagamento
                  ? new Date(pagamento.data_pagamento).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                  : "-"}
              </td>
              <td className="p-4 align-middle text-right font-medium text-green-600">
                R$ {parseFloat(pagamento.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </td>
              <td className="p-4 align-middle text-center">
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-800 hover:bg-green-200">
                  Pago
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RecentExpensesTable = () => {
  const { data: ultimasDespesas, isLoading } = useCustosRecentes(10);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ultimasDespesas?.length) {
    return <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa registrada.</p>;
  }

  return (
    <div className="relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm text-left">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Descrição</th>
            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Categoria</th>
            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Data</th>
            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Valor</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {ultimasDespesas.map((despesa: any) => (
            <tr key={despesa.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <td className="p-4 align-middle font-medium">{despesa.descricao}</td>
              <td className="p-4 align-middle">{despesa.tipo}</td>
              <td className="p-4 align-middle">
                {format(new Date(despesa.data), "dd/MM/yyyy")}
              </td>
              <td className="p-4 align-middle text-right font-medium text-destructive">
                - R$ {parseFloat(despesa.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const InadimplenciaTable = () => {
  const { toast } = useToast();
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const { data: inadimplentes, isLoading } = useInadimplentes();

  const handleSendReminder = async (pagamento: any) => {
    try {
      setSendingEmail(pagamento.id);

      const emailResponsavel = pagamento.matricula?.aluno?.responsavel?.email;

      if (!emailResponsavel) {
        toast({
          title: "Email não encontrado",
          description: "O responsável não possui email cadastrado.",
          variant: "destructive",
        });
        return;
      }

      const hoje = new Date();
      const vencimento = new Date(pagamento.data_vencimento);
      const diffTime = Math.abs(hoje.getTime() - vencimento.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const { error } = await supabase.functions.invoke("send-payment-reminder", {
        body: {
          to: emailResponsavel,
          responsavelNome: pagamento.matricula?.aluno?.responsavel?.nome_completo || "Responsável",
          alunoNome: pagamento.matricula?.aluno?.nome_completo || "Aluno",
          atividadeNome: pagamento.matricula?.turma?.atividade?.nome || "Atividade",
          turmaNome: pagamento.matricula?.turma?.nome || "Turma",
          valorDevido: parseFloat(pagamento.valor),
          diasAtraso: diffDays,
          dataVencimento: new Date(pagamento.data_vencimento).toLocaleDateString("pt-BR"),
        },
      });

      if (error) throw error;

      toast({
        title: "Lembrete enviado!",
        description: `Email enviado para ${pagamento.matricula?.aluno?.responsavel?.nome_completo}.`,
      });

    } catch (error: any) {
      console.error("Erro ao enviar lembrete:", error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar o lembrete. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!inadimplentes?.length) {
    return <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento em atraso.</p>;
  }

  return (
    <div className="relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm text-left">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Responsável / Aluno</th>
            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Vencimento</th>
            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Valor</th>
            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ação</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {inadimplentes.map((pagamento: any) => (
            <tr key={pagamento.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <td className="p-4 align-middle">
                <div className="flex flex-col">
                  <span className="font-medium">{pagamento.matricula?.aluno?.responsavel?.nome_completo || "Sem Responsável"}</span>
                  <span className="text-xs text-muted-foreground">Aluno: {pagamento.matricula?.aluno?.nome_completo}</span>
                </div>
              </td>
              <td className="p-4 align-middle text-destructive font-medium">
                {new Date(pagamento.data_vencimento).toLocaleDateString("pt-BR")}
              </td>
              <td className="p-4 align-middle text-right font-medium">
                R$ {parseFloat(pagamento.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </td>
              <td className="p-4 align-middle text-right">
                <Button
                  size="sm"
                  variant="outline"
                  // @ts-ignore
                  className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => handleSendReminder(pagamento)}
                  disabled={sendingEmail === pagamento.id}
                >
                  {sendingEmail === pagamento.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Lembrete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Financeiro;
