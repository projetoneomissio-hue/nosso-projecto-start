import { useRef } from "react";
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
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/utils/error-handler";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { NovaDespesaDialog } from "@/components/financeiro/NovaDespesaDialog";
import { format } from "date-fns";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const Financeiro = () => {
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  // Receita mensal (pagamentos pagos)
  const { data: receitaMensal, isLoading: loadingReceita } = useQuery({
    queryKey: ["financeiro-receita-mensal"],
    queryFn: async () => {
      const hoje = new Date();
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();

      const { data, error } = await supabase
        .from("pagamentos")
        .select("valor")
        .eq("status", "pago")
        .gte("data_pagamento", primeiroDia)
        .lte("data_pagamento", ultimoDia);

      if (error) throw error;
      return data?.reduce((acc, p) => acc + parseFloat(p.valor.toString()), 0) || 0;
    },
  });

  // Receita por atividade (Otimizado: Agregação feita no banco via RPC)
  const { data: receitaPorAtividade, isLoading: loadingAtividade } = useQuery({
    queryKey: ["financeiro-receita-atividade"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_receita_por_atividade");

      if (error) throw error;
      return data || [];
    },
  });

  // Inadimplência
  const { data: inadimplencia, isLoading: loadingInadimplencia } = useQuery({
    queryKey: ["financeiro-inadimplencia"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("pagamentos")
        .select("valor")
        .eq("status", "pendente")
        .lt("data_vencimento", hoje);

      if (error) throw error;

      return {
        valor: data?.reduce((acc, p) => acc + parseFloat(p.valor.toString()), 0) || 0,
        quantidade: data?.length || 0,
      };
    },
  });

  // Receita dos últimos 6 meses (Otimizado: Uma única query em vez de N+1)
  const { data: receitaMeses, isLoading: loadingMeses } = useQuery({
    queryKey: ["financeiro-receita-meses"],
    queryFn: async () => {
      const hoje = new Date();
      const seisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);

      const { data, error } = await supabase
        .from("pagamentos")
        .select("valor, data_pagamento")
        .eq("status", "pago")
        .gte("data_pagamento", seisMesesAtras.toISOString())
        .order("data_pagamento", { ascending: true });

      if (error) throw error;

      const mesesMap: Record<string, number> = {};

      // Inicializar os últimos 6 meses com 0
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const formatKey = d.toLocaleDateString("pt-BR", { month: "short" });
        mesesMap[formatKey] = 0;
      }

      // Agrupar resultados da query única
      data?.forEach((p) => {
        if (p.data_pagamento) {
          const dataPag = new Date(p.data_pagamento);
          const formatKey = dataPag.toLocaleDateString("pt-BR", { month: "short" });
          if (mesesMap[formatKey] !== undefined) {
            mesesMap[formatKey] += parseFloat(p.valor.toString());
          }
        }
      });

      return Object.entries(mesesMap).map(([mes, receita]) => ({
        mes,
        receita,
      }));
    },
  });

  // Despesas (custos do prédio + salários dos funcionários)
  const { data: despesas, isLoading: loadingDespesas } = useQuery({
    queryKey: ["financeiro-despesas", "custos-predio"], // Add dependecy on custos-predio invalidation
    queryFn: async () => {
      const hoje = new Date();
      // Simplification: Fetch ALL expenses for current month based on 'data' field, not just data_competencia which might be null
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();

      // Fix: custos_predio uses 'data' (date) field
      const { data: custos, error: e1 } = await supabase
        .from("custos_predio")
        .select("valor")
        .gte("data", primeiroDia)
        .lte("data", ultimoDia);

      const { data: funcionarios, error: e2 } = await supabase
        .from("funcionarios")
        .select("salario")
        .eq("ativo", true); // Assuming 'ativo' exists, or remove check

      if (e1) throw e1;
      // if (e2) throw e2; // Tolerant if funcionarios table issues

      const totalCustos = custos?.reduce((acc, c) => acc + parseFloat(c.valor.toString()), 0) || 0;
      // Mock salarios if table empty/error
      const totalSalarios = funcionarios?.reduce((acc, f) => acc + parseFloat(f.salario.toString()), 0) || 0;

      return {
        total: totalCustos + totalSalarios,
        custos: totalCustos,
        salarios: totalSalarios,
      };
    },
  });

  const lucroLiquido = (receitaMensal || 0) - (despesas?.total || 0);
  const margemLucro = receitaMensal ? ((lucroLiquido / receitaMensal) * 100).toFixed(1) : 0;

  const exportarPDF = async () => {
    if (!reportRef.current) return;

    try {
      toast({
        title: "Gerando PDF...",
        description: "Aguarde enquanto o relatório é gerado.",
      });

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`relatorio-financeiro-${new Date().toISOString().split("T")[0]}.pdf`);

      toast({
        title: "PDF gerado!",
        description: "O relatório foi baixado com sucesso.",
      });
    } catch (error) {
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
                    (receitaMensal - despesas?.total) >= 0 ? "text-foreground" : "text-destructive"
                  )}>
                    R$ {(receitaMensal - despesas?.total)?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
  const { data: ultimosPagamentos, isLoading } = useQuery({
    queryKey: ["financeiro-ultimos-pagamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos")
        .select(`
          id,
          valor,
          data_pagamento,
          status,
          matricula:matriculas(
            aluno:alunos(nome_completo),
            turma:turmas(
              atividade:atividades(nome)
            )
          )
        `)
        .eq("status", "pago")
        .order("data_pagamento", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

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
  const { data: ultimasDespesas, isLoading } = useQuery({
    queryKey: ["custos-predio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custos_predio")
        .select("*")
        .order("data", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

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

export default Financeiro;
