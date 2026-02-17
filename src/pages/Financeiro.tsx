import { useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useFinanceiroKPIs, useDespesasPorCategoria, useFluxoCaixaMeses, useReceitaPorAtividade } from "@/hooks/useFinanceiro";
import { financeiroService } from "@/services/financeiro.service";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/utils/error-handler";
import { pdf } from "@react-pdf/renderer";
import { RelatorioFinanceiro } from "@/components/reports/RelatorioFinanceiro";
import { NovaDespesaDialog } from "@/components/financeiro/NovaDespesaDialog";
import { CentralCobranca } from "@/components/financeiro/CentralCobranca";
import { KpiCard } from "@/components/financeiro/KpiCard";
import { RecentPaymentsTable } from "@/components/financeiro/RecentPaymentsTable";
import { RecentExpensesTable } from "@/components/financeiro/RecentExpensesTable";
import { InadimplenciaTable } from "@/components/financeiro/InadimplenciaTable";
import { format } from "date-fns";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const Financeiro = () => {
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  // Novos Hooks Otimizados
  const { data: kpis, isLoading: loadingKPIs } = useFinanceiroKPIs();
  const { data: despesasPorCategoria, isLoading: loadingDespesasCat } = useDespesasPorCategoria();
  const { data: fluxoCaixa, isLoading: loadingFluxo } = useFluxoCaixaMeses(6);
  const { data: receitaPorAtividade, isLoading: loadingAtividade } = useReceitaPorAtividade();

  const exportarCSV = async () => {
    try {
      toast({ title: "Gerando CSV...", description: "Processando dados." });
      const { data } = await financeiroService.fetchDadosPDF();

      const headers = ["ID", "Descrição", "Valor", "Tipo", "Categoria", "Data", "Status"];
      const rows = data.map((item: any) => [
        item.id,
        `"${item.descricao}"`,
        item.valor,
        item.tipo,
        item.categoria,
        item.data_vencimento || item.created_at,
        item.status
      ]);

      const csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `financeiro-${format(new Date(), "MM-yyyy")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Erro ao gerar CSV:", error);
      toast({ title: "Erro ao exportar", variant: "destructive" });
    }
  };

  const exportarPDF = async () => {
    try {
      toast({
        title: "Gerando relatório...",
        description: "Buscando dados e gerando PDF.",
      });

      const { data, periodo } = await financeiroService.fetchDadosPDF();

      const transacoes = data.map((item: any) => ({
        id: item.id,
        descricao: item.descricao,
        valor: item.valor,
        tipo: item.tipo,
        data_vencimento: item.data_vencimento || item.created_at,
        categoria: item.categoria,
        status: item.status
      }));

      const blob = await pdf(
        <RelatorioFinanceiro
          transacoes={transacoes}
          periodo={periodo}
          tipo="geral"
        />
      ).toBlob();

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

  if (loadingKPIs || loadingFluxo || loadingDespesasCat) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Financeiro</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral da saúde financeira da escola
            </p>
          </div>
          <div className="flex gap-2">
            <NovaDespesaDialog />
            <Button onClick={exportarPDF} variant="outline" className="gap-2 shadow-sm">
              <Download className="h-4 w-4" />
              Relatório PDF
            </Button>
            <Button onClick={exportarCSV} variant="outline" className="gap-2 shadow-sm">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <div ref={reportRef} className="space-y-8">
          <Tabs defaultValue="painel" className="space-y-6">
            <TabsList>
              <TabsTrigger value="painel">Painel Geral</TabsTrigger>
              <TabsTrigger value="cobranca" className="gap-2">
                <Users className="h-4 w-4" />
                Central de Cobrança
              </TabsTrigger>
            </TabsList>

            <TabsContent value="painel" className="space-y-8 animate-fade-in">
              {/* KPIs Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title="Receita Mensal"
                  value={kpis?.receita.total || 0}
                  variation={kpis?.receita.variacao || 0}
                  icon={DollarSign}
                  color="text-emerald-500"
                  borderColor="border-emerald-500"
                />
                <KpiCard
                  title="Despesas Mensais"
                  value={kpis?.despesas.total || 0}
                  variation={kpis?.despesas.variacao || 0}
                  icon={TrendingDown}
                  color="text-red-500"
                  borderColor="border-red-500"
                  inverse
                />
                <KpiCard
                  title="Lucro Líquido"
                  value={kpis?.lucro.total || 0}
                  variation={kpis?.lucro.variacao || 0}
                  icon={TrendingUp}
                  color="text-blue-500"
                  borderColor="border-blue-500"
                />
                <Card className="transition-all hover:shadow-lg border-l-4 border-l-amber-500">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Inadimplência</CardTitle>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      R$ {kpis?.inadimplencia.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpis?.inadimplencia.quantidade} pagamentos pendentes
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos Principais */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Fluxo de Caixa (Maior) */}
                <Card className="col-span-4 shadow-sm">
                  <CardHeader>
                    <CardTitle>Fluxo de Caixa (6 Meses)</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={fluxoCaixa}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                          dataKey="mes"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `R$ ${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                        />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, ""]}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar name="Receita" dataKey="receita" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar name="Despesas" dataKey="despesa" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Despesas por Categoria (Menor) */}
                <Card className="col-span-3 shadow-sm">
                  <CardHeader>
                    <CardTitle>Despesas por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={despesasPorCategoria}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {despesasPorCategoria?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                        <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Receita por Atividade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={receitaPorAtividade} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="nome"
                          type="category"
                          width={100}
                          tick={{ fontSize: 12, fill: '#6B7280' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Receita"]}
                        />
                        <Bar dataKey="valor" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-amber-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      Inadimplência Recente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px] overflow-auto pr-2">
                    <InadimplenciaTable />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader><CardTitle>Últimos Pagamentos</CardTitle></CardHeader>
                  <CardContent><RecentPaymentsTable /></CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader><CardTitle>Despesas Recentes</CardTitle></CardHeader>
                  <CardContent><RecentExpensesTable /></CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cobranca" className="animate-fade-in">
              <CentralCobranca />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Financeiro;
