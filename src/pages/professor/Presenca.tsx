import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

type PresencaStatus = {
  [key: string]: {
    presente: boolean;
    observacao: string;
  };
};

const Presenca = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [presencas, setPresencas] = useState<PresencaStatus>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch turmas do professor
  const { data: turmas } = useQuery({
    queryKey: ["turmas-professor", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: professor, error: e1 } = await supabase
        .from("professores")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (e1) throw e1;

      const { data, error } = await supabase
        .from("turmas")
        .select(`
          id,
          nome,
          atividade:atividades(nome)
        `)
        .eq("professor_id", professor.id)
        .eq("ativa", true);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch alunos da turma selecionada
  const { data: alunos, isLoading: loadingAlunos } = useQuery({
    queryKey: ["alunos-turma", selectedTurma],
    queryFn: async () => {
      if (!selectedTurma) return [];

      const { data, error } = await supabase
        .from("matriculas")
        .select(`
          id,
          aluno:alunos(
            id,
            nome_completo
          )
        `)
        .eq("turma_id", selectedTurma)
        .eq("status", "ativa");

      if (error) throw error;
      return data;
    },
    enabled: !!selectedTurma,
  });

  // Fetch presenças existentes para a data selecionada
  const { data: presencasExistentes, isLoading: loadingPresencas } = useQuery({
    queryKey: ["presencas-data", selectedTurma, date],
    queryFn: async () => {
      if (!selectedTurma || !date) return [];

      const dataFormatada = format(date, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("presencas")
        .select("*")
        .eq("data", dataFormatada)
        .in(
          "matricula_id",
          alunos?.map((a) => a.id) || []
        );

      if (error) throw error;
      return data;
    },
    enabled: !!selectedTurma && !!date && !!alunos,
  });

  // Atualiza estado local quando carrega presenças existentes
  useState(() => {
    if (presencasExistentes && alunos) {
      const newPresencas: PresencaStatus = {};
      alunos.forEach((matricula) => {
        const presencaExistente = presencasExistentes.find(
          (p) => p.matricula_id === matricula.id
        );
        if (presencaExistente) {
          newPresencas[matricula.id] = {
            presente: presencaExistente.presente,
            observacao: presencaExistente.observacao || "",
          };
        }
      });
      setPresencas(newPresencas);
    }
  });

  // Mutation para salvar presenças
  const salvarPresencaMutation = useMutation({
    mutationFn: async () => {
      if (!date || !selectedTurma || !alunos) return;

      const dataFormatada = format(date, "yyyy-MM-dd");

      // Prepara dados para inserção/atualização
      const presencasParaSalvar = alunos.map((matricula) => {
        const status = presencas[matricula.id] || { presente: false, observacao: "" };
        return {
          matricula_id: matricula.id,
          data: dataFormatada,
          presente: status.presente,
          observacao: status.observacao || null,
        };
      });

      // Deleta presenças existentes para essa data/turma
      const { error: deleteError } = await supabase
        .from("presencas")
        .delete()
        .eq("data", dataFormatada)
        .in(
          "matricula_id",
          alunos.map((a) => a.id)
        );

      if (deleteError) throw deleteError;

      // Insere novas presenças
      const { error: insertError } = await supabase
        .from("presencas")
        .insert(presencasParaSalvar);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presencas-data"] });
      toast({
        title: "Presença salva",
        description: "O registro de presença foi salvo com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o registro de presença.",
        variant: "destructive",
      });
    },
  });

  const handlePresencaChange = (matriculaId: string, presente: boolean) => {
    setPresencas((prev) => ({
      ...prev,
      [matriculaId]: {
        ...prev[matriculaId],
        presente,
      },
    }));
  };

  const handleObservacaoChange = (matriculaId: string, observacao: string) => {
    setPresencas((prev) => ({
      ...prev,
      [matriculaId]: {
        ...prev[matriculaId],
        observacao,
      },
    }));
  };

  const handleSalvar = () => {
    if (!date) {
      toast({
        title: "Selecione uma data",
        description: "Por favor, selecione a data da aula.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTurma) {
      toast({
        title: "Selecione uma turma",
        description: "Por favor, selecione a turma.",
        variant: "destructive",
      });
      return;
    }

    salvarPresencaMutation.mutate();
  };

  const totalPresentes = alunos
    ? Object.keys(presencas).filter((key) => presencas[key]?.presente).length
    : 0;
  const totalAlunos = alunos?.length || 0;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registro de Presença</h1>
          <p className="text-muted-foreground mt-1">
            Marque a presença dos alunos nas suas turmas
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Selecione a Data</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                locale={ptBR}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chamada</CardTitle>
                {selectedTurma && (
                  <Badge variant="secondary">
                    {totalPresentes}/{totalAlunos} presentes
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Turma</Label>
                <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas?.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome} - {turma.atividade.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loadingAlunos || loadingPresencas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : selectedTurma && alunos && alunos.length > 0 ? (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {alunos.map((matricula) => (
                      <Card key={matricula.id}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`aluno-${matricula.id}`}
                              checked={presencas[matricula.id]?.presente || false}
                              onCheckedChange={(checked) =>
                                handlePresencaChange(matricula.id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`aluno-${matricula.id}`}
                              className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {matricula.aluno.nome_completo}
                              {presencas[matricula.id]?.presente && (
                                <CheckCircle2 className="inline ml-2 h-4 w-4 text-green-500" />
                              )}
                            </label>
                          </div>
                          <Textarea
                            placeholder="Observações (opcional)"
                            value={presencas[matricula.id]?.observacao || ""}
                            onChange={(e) =>
                              handleObservacaoChange(matricula.id, e.target.value)
                            }
                            rows={2}
                            className="text-sm"
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSalvar}
                    disabled={salvarPresencaMutation.isPending}
                  >
                    {salvarPresencaMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Presença
                  </Button>
                </>
              ) : selectedTurma ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum aluno matriculado nesta turma.
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Selecione uma turma para visualizar os alunos.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Presenca;
