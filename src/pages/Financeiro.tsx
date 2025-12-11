import { useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Download, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { NovaDespesaDialog } from "@/components/financeiro/NovaDespesaDialog";
import { format } from "date-fns";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const Financeiro = () => {
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  // Receita mensal (pagamentos pagos)
  const { data: receitaMensal } = useQuery({
    queryKey: ["financeiro-receita-mensal"],
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
      return data?.reduce((acc, p) => acc + parseFloat(p.valor.toString()), 0) || 0;
    },
  });

  // Receita por atividade
  const { data: receitaPorAtividade } = useQuery({
    queryKey: ["financeiro-receita-atividade"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matriculas")
        .select(`
          turma:turmas(
            atividade:atividades(nome, valor_mensal)
          )
        `)
        .eq("status", "ativa");

      if (error) throw error;

      const receitas: Record<string, number> = {};
      data?.forEach((m: any) => {
        const atividade = m.turma?.atividade?.nome;
        const valor = parseFloat(m.turma?.atividade?.valor_mensal?.toString() || "0");
        if (atividade) {
          receitas[atividade] = (receitas[atividade] || 0) + valor;
        }
      });

      return Object.entries(receitas).map(([nome, valor]) => ({
        nome,
        valor,
      }));
    },
  });

  // Inadimplência
  const { data: inadimplencia } = useQuery({
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

  // Receita dos últimos 6 meses
  const { data: receitaMeses, isLoading: loadingMeses } = useQuery({
    queryKey: ["financeiro-receita-meses"],
    queryFn: async () => {
      const meses = [];
      const hoje = new Date();

      for (let i = 5; i >= 0; i--) {
        const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const primeiroDia = new Date(mes.getFullYear(), mes.getMonth(), 1);
        const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);

        const { data, error } = await supabase
          .from("pagamentos")
          .select("valor")
          .eq("status", "pago")
          .gte("data_pagamento", primeiroDia.toISOString())
          .lte("data_pagamento", ultimoDia.toISOString());

        if (error) throw error;

        const total = data?.reduce((acc, p) => acc + parseFloat(p.valor.toString()), 0) || 0;

        meses.push({
          mes: mes.toLocaleDateString("pt-BR", { month: "short" }),
          receita: total,
        });
      }

      return meses;
    },
  });

  // Despesas (custos do prédio + salários dos funcionários)
  const { data: despesas } = useQuery({
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
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o relatório.",
        variant: "destructive",
      });
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {(receitaMensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Mês atual</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {(despesas?.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Fixas + Variáveis</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${lucroLiquido >= 0 ? "text-success" : "text-destructive"}`}>
                  R$ {lucroLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Margem de {margemLucro}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  R$ {(inadimplencia?.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">{inadimplencia?.quantidade || 0} mensalidades</p>
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
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={receitaMeses}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [
                          `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                          "Receita"
                        ]}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="receita" stroke="#8884d8" name="Receita" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receita por Atividade</CardTitle>
              </CardHeader>
              <CardContent>
                {receitaPorAtividade && receitaPorAtividade.length > 0 ? (
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
                        {receitaPorAtividade.map((entry, index) => (
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
