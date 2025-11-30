import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";

const matriculaSchema = z.object({
  aluno_id: z.string().uuid("Selecione um aluno"),
  turma_id: z.string().uuid("Selecione uma turma"),
});

const NovaMatricula = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedAlunoId, setSelectedAlunoId] = useState("");
  const [selectedAtividadeId, setSelectedAtividadeId] = useState("");
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch alunos do responsável
  const { data: alunos, isLoading: loadingAlunos } = useQuery({
    queryKey: ["alunos-responsavel", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("alunos")
        .select("id, nome_completo, data_nascimento")
        .eq("responsavel_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch atividades ativas
  const { data: atividades } = useQuery({
    queryKey: ["atividades-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select("id, nome, descricao, valor_mensal")
        .eq("ativa", true)
        .order("nome");

      if (error) throw error;
      return data;
    },
  });

  // Fetch turmas da atividade selecionada
  const { data: turmas, isLoading: loadingTurmas } = useQuery({
    queryKey: ["turmas-atividade", selectedAtividadeId],
    queryFn: async () => {
      if (!selectedAtividadeId) return [];

      const { data, error } = await supabase
        .from("turmas")
        .select(`
          id,
          nome,
          horario,
          dias_semana,
          capacidade_maxima,
          matriculas(count)
        `)
        .eq("atividade_id", selectedAtividadeId)
        .eq("ativa", true);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedAtividadeId,
  });

  // Mutation para criar matrícula
  const criarMatriculaMutation = useMutation({
    mutationFn: async (data: { aluno_id: string; turma_id: string }) => {
      const dataInicio = new Date().toISOString().split("T")[0];

      const { error } = await supabase
        .from("matriculas")
        .insert([
          {
            aluno_id: data.aluno_id,
            turma_id: data.turma_id,
            data_inicio: dataInicio,
            status: "pendente",
          },
        ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas-aluno"] });
      toast({
        title: "Matrícula solicitada!",
        description: "Aguarde a aprovação da coordenação.",
      });
      // Limpa formulário
      setSelectedAlunoId("");
      setSelectedAtividadeId("");
      setSelectedTurmaId("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao solicitar matrícula",
        description: error.message || "Não foi possível solicitar a matrícula.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = matriculaSchema.parse({
        aluno_id: selectedAlunoId,
        turma_id: selectedTurmaId,
      });
      setFormErrors({});
      criarMatriculaMutation.mutate({
        aluno_id: validated.aluno_id,
        turma_id: validated.turma_id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
      }
    }
  };

  const atividadeSelecionada = atividades?.find((a) => a.id === selectedAtividadeId);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nova Matrícula</h1>
          <p className="text-muted-foreground mt-1">
            Inscreva seu aluno em uma atividade
          </p>
        </div>

        {loadingAlunos ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : alunos && alunos.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Você precisa cadastrar um aluno antes de solicitar uma matrícula.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Dados da Matrícula</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aluno">Selecione o Aluno *</Label>
                  <Select value={selectedAlunoId} onValueChange={setSelectedAlunoId}>
                    <SelectTrigger id="aluno">
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos?.map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id}>
                          {aluno.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.aluno_id && (
                    <p className="text-sm text-destructive">{formErrors.aluno_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="atividade">Selecione a Atividade *</Label>
                  <Select
                    value={selectedAtividadeId}
                    onValueChange={(value) => {
                      setSelectedAtividadeId(value);
                      setSelectedTurmaId(""); // Reset turma ao mudar atividade
                    }}
                  >
                    <SelectTrigger id="atividade">
                      <SelectValue placeholder="Selecione uma atividade" />
                    </SelectTrigger>
                    <SelectContent>
                      {atividades?.map((atividade) => (
                        <SelectItem key={atividade.id} value={atividade.id}>
                          {atividade.nome} - R${" "}
                          {parseFloat(atividade.valor_mensal.toString()).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                          /mês
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {atividadeSelecionada && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{atividadeSelecionada.nome}</strong>
                      {atividadeSelecionada.descricao && (
                        <p className="mt-1">{atividadeSelecionada.descricao}</p>
                      )}
                      <p className="mt-2 font-semibold">
                        Valor Mensal: R${" "}
                        {parseFloat(atividadeSelecionada.valor_mensal.toString()).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {selectedAtividadeId && (
                  <div className="space-y-2">
                    <Label htmlFor="turma">Selecione a Turma/Horário *</Label>
                    {loadingTurmas ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : turmas && turmas.length > 0 ? (
                      <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
                        <SelectTrigger id="turma">
                          <SelectValue placeholder="Selecione o horário" />
                        </SelectTrigger>
                        <SelectContent>
                          {turmas.map((turma) => {
                            const matriculasCount = turma.matriculas?.[0]?.count || 0;
                            const vagasDisponiveis = turma.capacidade_maxima - matriculasCount;
                            const turmaLotada = vagasDisponiveis <= 0;

                            return (
                              <SelectItem
                                key={turma.id}
                                value={turma.id}
                                disabled={turmaLotada}
                              >
                                {turma.nome} - {turma.dias_semana.join(", ")} {turma.horario}
                                {turmaLotada ? " (Lotada)" : ` (${vagasDisponiveis} vagas)`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma turma disponível para esta atividade.
                      </p>
                    )}
                    {formErrors.turma_id && (
                      <p className="text-sm text-destructive">{formErrors.turma_id}</p>
                    )}
                  </div>
                )}

                {selectedTurmaId && (
                  <div className="pt-4">
                    <Alert>
                      <AlertDescription>
                        <strong>Atenção:</strong> Após solicitar a matrícula, aguarde a aprovação
                        da coordenação. Você será notificado sobre o status.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={criarMatriculaMutation.isPending || !selectedAlunoId || !selectedTurmaId}
                  >
                    {criarMatriculaMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Solicitar Matrícula
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NovaMatricula;
