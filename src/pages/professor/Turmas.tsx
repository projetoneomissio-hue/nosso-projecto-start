
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Clock, Calendar as CalendarIcon, ArrowRight, NotebookPen, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const Turmas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: turmas, isLoading } = useQuery({
    queryKey: ["professor-turmas", user?.id],
    queryFn: async () => {
      // Get professor record
      const { data: professor, error: profError } = await supabase
        .from("professores")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (profError) {
        return [];
      }

      if (!professor) {
        return [];
      }

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
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-bold text-primary tracking-widest uppercase">Portal do Professor</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Minhas Turmas
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Gestão de turmas e acesso rápido ao diário de classe.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass border-white/10">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !turmas || turmas.length === 0 ? (
          <Card className="glass border-white/5 bg-white/5 overflow-hidden relative">
            {/* decorative background element */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            <CardContent className="flex flex-col items-center justify-center py-20 relative z-10 text-center px-4">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6 shadow-inner">
                <Users className="h-10 w-10 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Nenhuma turma atribuída</h3>
              <p className="text-muted-foreground max-w-md">
                Você ainda não foi alocado(a) como professor(a) responsável em nenhuma turma ativa no momento. Procure a coordenação.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {turmas.map((turma) => {
              const isCheia = turma.alunosMatriculados >= turma.capacidade_maxima;
              const taxaOcupacao = Math.round((turma.alunosMatriculados / turma.capacidade_maxima) * 100);

              return (
                <Card
                  key={turma.id}
                  className="group relative overflow-hidden glass border-white/10 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_32px_-4px_rgba(var(--primary),0.2)] hover:-translate-y-1 cursor-pointer"
                  onClick={() => navigate(`/professor/chamada?turma=${turma.id}`)}
                >
                  {/* Hover Gradient Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 backdrop-blur-md">
                        {turma.atividades?.nome}
                      </Badge>
                      <div className="flex -space-x-2">
                        <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shadow-sm">
                          {turma.alunosMatriculados}
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                      {turma.nome}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="relative z-10 space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        <span className="truncate" title={turma.dias_semana.join(", ")}>
                          {turma.dias_semana.join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{turma.horario}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Ocupação da Turma</span>
                        <span className={isCheia ? "text-red-500" : "text-primary"}>
                          {turma.alunosMatriculados} / {turma.capacidade_maxima}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${isCheia ? "bg-red-500" : "bg-primary"
                            }`}
                          style={{ width: `${Math.min(taxaOcupacao, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-3">
                      <Button
                        className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors h-10 shadow-lg shadow-primary/20"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/professor/chamada?turma=${turma.id}`);
                        }}
                      >
                        <NotebookPen className="h-4 w-4" />
                        Chamada
                      </Button>
                      <Button
                        className="w-full gap-2 hover:bg-yellow-500 hover:text-white transition-colors h-10 shadow-lg"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/professor/avaliacoes?turma=${turma.id}`);
                        }}
                      >
                        <Trophy className="h-4 w-4" />
                        Notas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Turmas;
