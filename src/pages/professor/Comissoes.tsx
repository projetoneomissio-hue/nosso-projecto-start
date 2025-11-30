import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const Comissoes = () => {
  const { user } = useAuth();

  const { data: comissaoData, isLoading } = useQuery({
    queryKey: ["professor-comissoes", user?.id],
    queryFn: async () => {
      const { data: professor } = await supabase
        .from("professores")
        .select("id, percentual_comissao")
        .eq("user_id", user?.id)
        .single();

      if (!professor) return null;

      // Get turmas do professor
      const { data: turmas } = await supabase
        .from("turmas")
        .select("id")
        .eq("professor_id", professor.id)
        .eq("ativa", true);

      if (!turmas || turmas.length === 0) return { current: 0, percentual: professor.percentual_comissao, history: [] };

      const turmaIds = turmas.map((t) => t.id);

      // Get active matriculas for current month
      const now = new Date();
      const { data: matriculas } = await supabase
        .from("matriculas")
        .select(`
          id,
          data_inicio,
          turma_id,
          turmas!inner (
            atividades!inner (
              valor_mensal
            )
          )
        `)
        .in("turma_id", turmaIds)
        .eq("status", "ativa");

      // Calculate current month commission
      let currentTotal = 0;
      let currentAlunos = 0;

      if (matriculas) {
        matriculas.forEach((m: any) => {
          const valorMensal = m.turmas?.atividades?.valor_mensal || 0;
          currentTotal += (valorMensal * professor.percentual_comissao) / 100;
          currentAlunos++;
        });
      }

      // Get last 6 months history
      const history = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = format(startOfMonth(date), "yyyy-MM-dd");
        const monthEnd = format(endOfMonth(date), "yyyy-MM-dd");

        const { data: monthMatriculas } = await supabase
          .from("matriculas")
          .select(`
            id,
            turmas!inner (
              atividades!inner (
                valor_mensal
              )
            )
          `)
          .in("turma_id", turmaIds)
          .eq("status", "ativa")
          .lte("data_inicio", monthEnd)
          .or(`data_fim.is.null,data_fim.gte.${monthStart}`);

        let monthTotal = 0;
        let monthAlunos = 0;

        if (monthMatriculas) {
          monthMatriculas.forEach((m: any) => {
            const valorMensal = m.turmas?.atividades?.valor_mensal || 0;
            monthTotal += (valorMensal * professor.percentual_comissao) / 100;
            monthAlunos++;
          });
        }

        // Check if payment was made (simplified - assuming current month is pending)
        const isPaid = i > 0;

        history.push({
          mes: format(date, "MMMM yyyy", { locale: ptBR }),
          totalAlunos: monthAlunos,
          total: monthTotal,
          status: isPaid ? "pago" : "pendente",
          percentual: professor.percentual_comissao,
        });
      }

      return {
        current: currentTotal,
        alunos: currentAlunos,
        percentual: professor.percentual_comissao,
        history,
      };
    },
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Comissões</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe seus ganhos mensais
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Este Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    R$ {comissaoData?.current.toFixed(2).replace(".", ",")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {comissaoData?.alunos} alunos ativos
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Percentual</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{comissaoData?.percentual}%</div>
                  <p className="text-xs text-muted-foreground">
                    Por aluno matriculado
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))}
              </div>
            ) : !comissaoData?.history || comissaoData.history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum histórico disponível
              </p>
            ) : (
              <div className="space-y-4">
                {comissaoData.history.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold capitalize">{item.mes}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.totalAlunos} alunos × {item.percentual}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        R$ {item.total.toFixed(2).replace(".", ",")}
                      </p>
                      <Badge
                        variant={item.status === "pago" ? "default" : "secondary"}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Comissoes;
