import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const AtividadesMatriculadas = () => {
  const { user } = useAuth();

  const { data: atividades, isLoading } = useQuery({
    queryKey: ["responsavel-atividades", user?.id],
    queryFn: async () => {
      // Get alunos of this responsavel
      const { data: alunos } = await supabase
        .from("alunos")
        .select("id, nome_completo")
        .eq("responsavel_id", user?.id);

      if (!alunos || alunos.length === 0) return [];

      const alunoIds = alunos.map((a) => a.id);

      // Get matriculas with turma and atividade info
      const { data: matriculas, error } = await supabase
        .from("matriculas")
        .select(`
          id,
          status,
          aluno_id,
          alunos!inner (
            nome_completo
          ),
          turmas!inner (
            nome,
            horario,
            dias_semana,
            atividades!inner (
              nome
            ),
            professores!inner (
              user_id,
              profiles:user_id (
                nome_completo
              )
            )
          )
        `)
        .in("aluno_id", alunoIds)
        .eq("status", "ativa");

      if (error) throw error;

      return (matriculas || []).map((m: any) => ({
        id: m.id,
        aluno: m.alunos?.nome_completo,
        nome: m.turmas?.atividades?.nome,
        turma: m.turmas?.nome,
        professor: m.turmas?.professores?.profiles?.nome_completo,
        horario: `${m.turmas?.dias_semana?.join(", ")} ${m.turmas?.horario}`,
        status: m.status,
      }));
    },
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Atividades Matriculadas
          </h1>
          <p className="text-muted-foreground mt-1">
            Atividades dos seus filhos
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !atividades || atividades.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Nenhuma atividade matriculada no momento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {atividades.map((atividade) => (
              <Card key={atividade.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{atividade.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Aluno: {atividade.aluno}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Turma: {atividade.turma}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Professor: {atividade.professor || "Não atribuído"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {atividade.horario}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge variant="default">{atividade.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AtividadesMatriculadas;
