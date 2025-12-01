import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MatriculasPendentes = () => {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedMatricula, setSelectedMatricula] = useState<any>(null);
  const [observacoes, setObservacoes] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch matrículas pendentes
  const { data: matriculasPendentes, isLoading } = useQuery({
    queryKey: ["matriculas-pendentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matriculas")
        .select(`
          *,
          aluno:alunos(
            nome_completo,
            data_nascimento,
            responsavel:profiles!alunos_responsavel_id_fkey(nome_completo, email, telefone)
          ),
          turma:turmas(
            nome,
            horario,
            dias_semana,
            capacidade_maxima,
            atividade:atividades(nome, valor_mensal),
            matriculas(count)
          )
        `)
        .eq("status", "pendente")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Aprovar matrícula e gerar pagamentos
  const aprovarMutation = useMutation({
    mutationFn: async ({ matriculaId, valorMensal }: { matriculaId: string; valorMensal: number }) => {
      // 1. Atualizar status da matrícula
      const { error: matriculaError } = await supabase
        .from("matriculas")
        .update({ status: "ativa" })
        .eq("id", matriculaId);

      if (matriculaError) throw matriculaError;

      // 2. Gerar pagamentos mensais (próximos 12 meses)
      const hoje = new Date();
      const pagamentos = [];

      for (let i = 0; i < 12; i++) {
        const vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + i + 1, 5);
        
        pagamentos.push({
          matricula_id: matriculaId,
          valor: valorMensal,
          data_vencimento: vencimento.toISOString().split("T")[0],
          status: "pendente",
        });
      }

      const { error: pagamentosError } = await supabase
        .from("pagamentos")
        .insert(pagamentos);

      if (pagamentosError) throw pagamentosError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas-pendentes"] });
      toast({
        title: "Matrícula aprovada",
        description: "A matrícula foi aprovada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar",
        description: error.message || "Não foi possível aprovar a matrícula.",
        variant: "destructive",
      });
    },
  });

  // Rejeitar matrícula
  const rejeitarMutation = useMutation({
    mutationFn: async ({ id, obs }: { id: string; obs: string }) => {
      const { error } = await supabase
        .from("matriculas")
        .update({ 
          status: "cancelada",
          observacoes: obs 
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas-pendentes"] });
      toast({
        title: "Matrícula rejeitada",
        description: "A matrícula foi rejeitada.",
      });
      setRejectDialogOpen(false);
      setSelectedMatricula(null);
      setObservacoes("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar",
        description: error.message || "Não foi possível rejeitar a matrícula.",
        variant: "destructive",
      });
    },
  });

  const handleAprovar = (matricula: any) => {
    // Verifica se a turma tem vagas
    const matriculasAtuais = matricula.turma.matriculas?.[0]?.count || 0;
    const vagasDisponiveis = matricula.turma.capacidade_maxima - matriculasAtuais;

    if (vagasDisponiveis <= 0) {
      toast({
        title: "Turma lotada",
        description: "Esta turma não tem mais vagas disponíveis.",
        variant: "destructive",
      });
      return;
    }

    const valorMensal = parseFloat(matricula.turma.atividade.valor_mensal.toString());
    aprovarMutation.mutate({ 
      matriculaId: matricula.id,
      valorMensal 
    });
  };

  const handleRejeitar = (matricula: any) => {
    setSelectedMatricula(matricula);
    setRejectDialogOpen(true);
  };

  const confirmRejeitar = () => {
    if (selectedMatricula) {
      rejeitarMutation.mutate({
        id: selectedMatricula.id,
        obs: observacoes,
      });
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Matrículas Pendentes</h1>
          <p className="text-muted-foreground mt-1">
            Aprovar ou rejeitar novas solicitações de matrícula
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : matriculasPendentes && matriculasPendentes.length > 0 ? (
          <div className="grid gap-4">
            {matriculasPendentes.map((item) => {
              const matriculasAtuais = item.turma.matriculas?.[0]?.count || 0;
              const vagasDisponiveis = item.turma.capacidade_maxima - matriculasAtuais;
              const turmaLotada = vagasDisponiveis <= 0;

              return (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{item.aluno.nome_completo}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Idade: {calculateAge(item.aluno.data_nascimento)} anos
                        </p>
                      </div>
                      <Badge>Pendente</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Atividade</h4>
                          <p className="text-sm">{item.turma.atividade.nome}</p>
                          <p className="text-sm text-muted-foreground">{item.turma.nome}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.turma.dias_semana.join(", ")} • {item.turma.horario}
                          </p>
                          <p className="text-sm font-semibold mt-1">
                            R$ {parseFloat(item.turma.atividade.valor_mensal.toString()).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                            /mês
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-2">Responsável</h4>
                          <p className="text-sm">{item.aluno.responsavel.nome_completo}</p>
                          <p className="text-xs text-muted-foreground">{item.aluno.responsavel.email}</p>
                          {item.aluno.responsavel.telefone && (
                            <p className="text-xs text-muted-foreground">
                              {item.aluno.responsavel.telefone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-1">Vagas</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={turmaLotada ? "destructive" : "default"}>
                            {matriculasAtuais}/{item.turma.capacidade_maxima} alunos
                          </Badge>
                          {turmaLotada && (
                            <div className="flex items-center gap-1 text-destructive text-xs">
                              <AlertCircle className="h-3 w-3" />
                              Turma lotada
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Solicitada em:{" "}
                          {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="gap-2 flex-1 sm:flex-initial"
                          onClick={() => handleAprovar(item)}
                          disabled={aprovarMutation.isPending || turmaLotada}
                        >
                          {aprovarMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Aprovar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 flex-1 sm:flex-initial text-destructive hover:text-destructive"
                          onClick={() => handleRejeitar(item)}
                          disabled={rejeitarMutation.isPending}
                        >
                          {rejeitarMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                Não há matrículas pendentes no momento.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog para rejeitar */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Rejeitar Matrícula</DialogTitle>
              <DialogDescription>
                Informe o motivo da rejeição. Esta informação será salva no sistema.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {selectedMatricula && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-semibold">
                    {selectedMatricula.aluno.nome_completo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedMatricula.turma.nome}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observacoes">Motivo da Rejeição</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Turma sem vagas, documentação incompleta, etc."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setSelectedMatricula(null);
                  setObservacoes("");
                }}
                disabled={rejeitarMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmRejeitar}
                disabled={rejeitarMutation.isPending}
                variant="destructive"
              >
                {rejeitarMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MatriculasPendentes;
