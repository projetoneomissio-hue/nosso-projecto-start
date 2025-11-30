import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const Turmas = () => {
  const { user } = useAuth();

  const { data: turmas, isLoading } = useQuery({
    queryKey: ["professor-turmas", user?.id],
    queryFn: async () => {
      // Get professor record
      const { data: professor } = await supabase
        .from("professores")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!professor) return [];

      // Get turmas with activity info and enrollment count
      const { data, error } = await supabase
        .from("turmas")
        .select(`
          id,
          nome,
          horario,
          dias_semana,
          capacidade_maxima,
          ativa,
          atividades (nome)
        `)
        .eq("professor_id", professor.id)
        .eq("ativa", true);

      if (error) throw error;

      // Count matriculas for each turma
      const turmasWithCounts = await Promise.all(
        (data || []).map(async (turma) => {
          const { count } = await supabase
            .from("matriculas")
            .select("*", { count: "exact", head: true })
            .eq("turma_id", turma.id)
            .eq("status", "ativa");

          return {
            ...turma,
            alunosMatriculados: count || 0,
          };
        })
      );

      return turmasWithCounts;
    },
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Turmas</h1>
          <p className="text-muted-foreground mt-1">
            Turmas sob sua responsabilidade
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !turmas || turmas.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Nenhuma turma atribuída</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {turmas.map((turma) => (
              <Card key={turma.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{turma.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {turma.atividades?.nome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {turma.dias_semana.join(", ")} • {turma.horario}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Badge variant="secondary">
                      {turma.alunosMatriculados} / {turma.capacidade_maxima} alunos
                    </Badge>
                    <Badge
                      variant={
                        turma.alunosMatriculados < turma.capacidade_maxima
                          ? "default"
                          : "destructive"
                      }
                    >
                      {turma.capacidade_maxima - turma.alunosMatriculados > 0
                        ? `${turma.capacidade_maxima - turma.alunosMatriculados} vagas`
                        : "Lotado"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Turmas;
