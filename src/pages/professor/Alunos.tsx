import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const Alunos = () => {
  const { user } = useAuth();

  const { data: alunos, isLoading } = useQuery({
    queryKey: ["professor-alunos", user?.id],
    queryFn: async () => {
      // Get professor record
      const { data: professor } = await supabase
        .from("professores")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!professor) return [];

      // Get all turmas of this professor
      const { data: turmas } = await supabase
        .from("turmas")
        .select("id, nome")
        .eq("professor_id", professor.id)
        .eq("ativa", true);

      if (!turmas || turmas.length === 0) return [];

      const turmaIds = turmas.map((t) => t.id);

      // Get matriculas with aluno info
      const { data: matriculas, error } = await supabase
        .from("matriculas")
        .select(`
          id,
          turma_id,
          turmas (nome),
          alunos (
            id,
            nome_completo
          )
        `)
        .in("turma_id", turmaIds)
        .eq("status", "ativa");

      if (error) throw error;

      // Calculate attendance for each aluno
      const alunosWithFrequency = await Promise.all(
        (matriculas || []).map(async (matricula) => {
          const { count: totalPresencas } = await supabase
            .from("presencas")
            .select("*", { count: "exact", head: true })
            .eq("matricula_id", matricula.id);

          const { count: presencasPositivas } = await supabase
            .from("presencas")
            .select("*", { count: "exact", head: true })
            .eq("matricula_id", matricula.id)
            .eq("presente", true);

          const frequencia =
            totalPresencas && totalPresencas > 0
              ? Math.round(((presencasPositivas || 0) / totalPresencas) * 100)
              : 0;

          return {
            id: matricula.alunos?.id,
            nome: matricula.alunos?.nome_completo,
            turma: matricula.turmas?.nome,
            frequencia,
          };
        })
      );

      return alunosWithFrequency;
    },
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lista de Alunos</h1>
          <p className="text-muted-foreground mt-1">
            Todos os alunos das suas turmas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alunos Matriculados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !alunos || alunos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum aluno matriculado nas suas turmas
              </p>
            ) : (
              <div className="space-y-4">
                {alunos.map((aluno) => (
                  <div
                    key={aluno.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {aluno.nome?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{aluno.nome}</h3>
                        <p className="text-sm text-muted-foreground">{aluno.turma}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Frequência: {aluno.frequencia}%
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
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

export default Alunos;
