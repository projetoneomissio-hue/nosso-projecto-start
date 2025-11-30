import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Matriculas = () => {
  const { data: matriculas, isLoading } = useQuery({
    queryKey: ["all-matriculas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matriculas")
        .select(`
          id,
          status,
          data_inicio,
          alunos!inner (
            nome_completo
          ),
          turmas!inner (
            nome,
            atividades!inner (
              nome
            )
          )
        `)
        .order("data_inicio", { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        aluno: m.alunos?.nome_completo,
        atividade: m.turmas?.atividades?.nome,
        turma: m.turmas?.nome,
        status: m.status,
        data: format(new Date(m.data_inicio), "dd/MM/yyyy", { locale: ptBR }),
      }));
    },
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ativa":
        return "default";
      case "pendente":
        return "secondary";
      case "cancelada":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Gerenciar Matrículas
            </h1>
            <p className="text-muted-foreground mt-1">
              Controle todas as matrículas do projeto
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Matrícula
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Matrículas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : !matriculas || matriculas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma matrícula encontrada
              </p>
            ) : (
              <div className="space-y-4">
                {matriculas.map((matricula) => (
                  <div
                    key={matricula.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{matricula.aluno}</h3>
                      <p className="text-sm text-muted-foreground">
                        {matricula.atividade} - {matricula.turma}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Data: {matricula.data}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant={getStatusVariant(matricula.status)}>
                        {matricula.status}
                      </Badge>
                      <Button variant="outline" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
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

export default Matriculas;
