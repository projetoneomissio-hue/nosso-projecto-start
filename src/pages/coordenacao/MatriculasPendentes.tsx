import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Phone, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUnidade } from "@/contexts/UnidadeContext";

const MatriculasPendentes = () => {
  const { currentUnidade } = useUnidade();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<any>(null);
  const [selectedTurma, setSelectedTurma] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 1. Fetch solicitações
  const { data: solicitacoes, isLoading } = useQuery({
    queryKey: ["solicitacoes_matricula", currentUnidade?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_matricula")
        .select("*")
        .eq("status", "pendente")
        .eq("unidade_id", currentUnidade?.id)
        .order("created_at", { ascending: false });

      // Gracefully handle missing table (pending migration)
      if (error) {
        if (error.code === "PGRST204" || error.message?.includes("does not exist")) {
          console.warn("Tabela solicitacoes_matricula ainda não existe. Execute as migrações pendentes.");
          return [];
        }
        throw error;
      }
      return data;
    },
    enabled: !!currentUnidade?.id,
  });

  // 2. Fetch turmas para o dialog de aprovação
  const { data: turmas } = useQuery({
    queryKey: ["turmas-disponiveis", currentUnidade?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas")
        .select("id, nome, horario, dias_semana, atividade:atividades(nome)")
        .eq("unidade_id", currentUnidade?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!approveDialogOpen && !!currentUnidade?.id,
  });

  // 3. Mutation de Aprovação
  const aprovarMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSolicitacao || !selectedTurma || !currentUnidade?.id) return;

      // A. Criar Aluno
      const { data: novoAluno, error: erroAluno } = await supabase
        .from("alunos")
        .insert({
          nome_completo: selectedSolicitacao.nome_completo,
          data_nascimento: selectedSolicitacao.data_nascimento,
          telefone: selectedSolicitacao.whatsapp,
          unidade_id: currentUnidade.id,
          // Outros campos null
        })
        .select("id")
        .single();

      if (erroAluno) throw new Error(`Erro ao criar aluno: ${erroAluno.message}`);

      // B. Criar Matrícula (Já ativa)
      const { error: erroMatricula } = await supabase
        .from("matriculas")
        .insert({
          aluno_id: novoAluno.id,
          turma_id: selectedTurma,
          unidade_id: currentUnidade.id,
          status: "ativa",
          data_matricula: new Date().toISOString(),
        });

      if (erroMatricula) throw new Error(`Erro ao matricular: ${erroMatricula.message}`);

      // C. Atualizar Solicitação
      const { error: erroSolicitacao } = await supabase
        .from("solicitacoes_matricula")
        .update({ status: "aprovada" })
        .eq("id", selectedSolicitacao.id);

      if (erroSolicitacao) throw new Error(`Erro ao atualizar solicitação: ${erroSolicitacao.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes_matricula"] });
      toast({ title: "Matrícula Aprovada com Sucesso!" });
      setApproveDialogOpen(false);
      setSelectedSolicitacao(null);
      setSelectedTurma("");
    },
    onError: (error: any) => {
      toast({ title: "Erro na aprovação", description: error.message, variant: "destructive" });
    }
  });

  // 4. Mutation de Rejeição
  const rejeitarMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSolicitacao) return;
      const { error } = await supabase
        .from("solicitacoes_matricula")
        .update({ status: "rejeitada" })
        .eq("id", selectedSolicitacao.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes_matricula"] });
      toast({ title: "Solicitação Rejeitada" });
      setRejectDialogOpen(false);
      setSelectedSolicitacao(null);
    },
  });

  const handleOpenApprove = (solicitacao: any) => {
    setSelectedSolicitacao(solicitacao);
    setApproveDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Solicitações de Matrícula</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de candidatos vindos da Matrícula Online
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
        ) : !solicitacoes?.length ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma solicitação pendente.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {solicitacoes.map((sol) => (
              <Card key={sol.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{sol.nome_completo}</CardTitle>
                    <Badge>Online</Badge>
                  </div>
                  <CardDescription>
                    Recebido em {format(new Date(sol.created_at), "dd/MM 'às' HH:mm")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{sol.whatsapp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Nasc: {format(new Date(sol.data_nascimento), "dd/MM/yyyy")}</span>
                  </div>

                  <div className="flex gap-2 mt-4 pt-2">
                    <Button className="w-full" size="sm" onClick={() => handleOpenApprove(sol)}>
                      <Check className="mr-2 h-4 w-4" /> Aprovar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedSolicitacao(sol); setRejectDialogOpen(true); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog Aprovar */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Matrícula</DialogTitle>
              <DialogDescription>
                Selecione a turma para enturmar <strong>{selectedSolicitacao?.nome_completo}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Turma de Destino</Label>
              <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma turma..." />
                </SelectTrigger>
                <SelectContent>
                  {turmas?.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.atividade?.nome} - {t.nome} ({t.dias_semana?.[0]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={() => aprovarMutation.mutate()} disabled={aprovarMutation.isPending || !selectedTurma}>
                {aprovarMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Matrícula
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Rejeitar */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Solicitação</DialogTitle>
              <DialogDescription>
                Tem certeza? O contato será removido da lista de pendentes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => rejeitarMutation.mutate()}>Rejeitar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MatriculasPendentes;

