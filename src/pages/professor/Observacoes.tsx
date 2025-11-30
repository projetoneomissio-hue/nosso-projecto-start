import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Observacoes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [turmaId, setTurmaId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [tipo, setTipo] = useState("");
  const [observacao, setObservacao] = useState("");

  // Get professor turmas
  const { data: turmas } = useQuery({
    queryKey: ["professor-turmas-obs", user?.id],
    queryFn: async () => {
      const { data: professor } = await supabase
        .from("professores")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!professor) return [];

      const { data } = await supabase
        .from("turmas")
        .select("id, nome")
        .eq("professor_id", professor.id)
        .eq("ativa", true);

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get alunos from selected turma
  const { data: alunos } = useQuery({
    queryKey: ["turma-alunos", turmaId],
    queryFn: async () => {
      if (!turmaId) return [];

      const { data } = await supabase
        .from("matriculas")
        .select(`
          id,
          aluno_id,
          alunos (
            id,
            nome_completo
          )
        `)
        .eq("turma_id", turmaId)
        .eq("status", "ativa");

      return data || [];
    },
    enabled: !!turmaId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: professor } = await supabase
        .from("professores")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!professor) throw new Error("Professor não encontrado");

      const { error } = await supabase.from("observacoes").insert({
        aluno_id: alunoId,
        turma_id: turmaId,
        professor_id: professor.id,
        tipo,
        observacao,
        data: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Observação salva!",
        description: "A observação foi registrada com sucesso.",
      });
      setTurmaId("");
      setAlunoId("");
      setTipo("");
      setObservacao("");
      queryClient.invalidateQueries({ queryKey: ["observacoes"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!turmaId || !alunoId || !tipo || !observacao.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos antes de salvar.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Observações e Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">
            Registre o desenvolvimento dos alunos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nova Observação</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="turma">Selecione a Turma</Label>
                <Select value={turmaId} onValueChange={setTurmaId}>
                  <SelectTrigger id="turma">
                    <SelectValue placeholder="Escolha uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas?.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aluno">Selecione o Aluno</Label>
                <Select
                  value={alunoId}
                  onValueChange={setAlunoId}
                  disabled={!turmaId}
                >
                  <SelectTrigger id="aluno">
                    <SelectValue placeholder="Escolha um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos?.map((matricula) => (
                      <SelectItem
                        key={matricula.aluno_id}
                        value={matricula.aluno_id}
                      >
                        {matricula.alunos?.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Observação</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Escolha o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desempenho">Desempenho</SelectItem>
                    <SelectItem value="comportamento">Comportamento</SelectItem>
                    <SelectItem value="evolucao">Evolução Técnica</SelectItem>
                    <SelectItem value="geral">Observação Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Descreva suas observações sobre o aluno..."
                  className="min-h-[150px]"
                />
              </div>

              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Observação
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Observacoes;
