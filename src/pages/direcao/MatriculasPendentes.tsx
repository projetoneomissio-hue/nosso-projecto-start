import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Calendar } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUnidade } from "@/contexts/UnidadeContext";
import { matriculasService } from "@/services/matriculas.service";

const MatriculasPendentes = () => {
  const { currentUnidade } = useUnidade();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedMatricula, setSelectedMatricula] = useState<any>(null);
  const [taxaMatricula, setTaxaMatricula] = useState<string>("25,00");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 1. Fetch matrículas pendentes
  const { data: matriculasPendentes, isLoading } = useQuery({
    queryKey: ["matriculas_pendentes", currentUnidade?.id],
    queryFn: () => matriculasService.fetchAll({ status: "pendente" }),
    enabled: !!currentUnidade?.id,
  });

  // 3. Mutation de Aprovação
  const aprovarMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMatricula || !currentUnidade?.id) return;

      // A. Atualizar Matrícula para status Ativa
      const { error: errUpdate } = await supabase
        .from("matriculas")
        .update({ status: "ativa" })
        .eq("id", selectedMatricula.id);

      if (errUpdate) throw new Error(`Erro ao aprovar matrícula: ${errUpdate.message}`);

      // B. Buscar valor da atividade para gerar primeiro pagamento
      const { data: turmaInfo } = await supabase
        .from("turmas")
        .select("atividade_id, atividades(valor_mensal)")
        .eq("id", selectedMatricula.turma_id)
        .single();

      const valorMensal = (turmaInfo as any)?.atividades?.valor_mensal || 0;

      if (valorMensal > 0) {
        // Buscar dia de vencimento configurado
        const { data: configData } = await supabase
          .from("configuracoes")
          .select("valor")
          .eq("chave", "dia_vencimento")
          .single();

        const diaVencimento = configData?.valor ? parseInt(configData.valor) : 5;

        // Calcular próximo vencimento 
        const hoje = new Date();
        let mesVencimento = hoje.getMonth() + 1;
        let anoVencimento = hoje.getFullYear();
        if (mesVencimento > 11) {
          mesVencimento = 0;
          anoVencimento++;
        }

        const ultimoDia = new Date(anoVencimento, mesVencimento + 1, 0).getDate();
        const diaFinal = Math.min(diaVencimento, ultimoDia);
        const dataVencimento = new Date(anoVencimento, mesVencimento, diaFinal);
        const referencia = `${anoVencimento}-${String(mesVencimento + 1).padStart(2, '0')}`;

        await supabase.from("pagamentos").insert({
          matricula_id: selectedMatricula.id,
          valor: valorMensal,
          data_vencimento: dataVencimento.toISOString().split("T")[0],
          status: "pendente",
          referencia: referencia,
          unidade_id: currentUnidade.id,
          descricao: `Mensalidade ${mesVencimento + 1}/${anoVencimento} - ${turmaInfo?.atividade?.nome || "Atividade"}`
        });
      }

      // NOVO: Gerar cobrança de Taxa de Matrícula (se houver)
      const valorTaxaNum = parseFloat(taxaMatricula.replace(",", "."));
      if (valorTaxaNum > 0) {
        // Taxa de matrícula vence hoje ou em 3 dias
        const hojeObj = new Date();
        hojeObj.setDate(hojeObj.getDate() + 3); // Dá 3 dias de prazo
        const dataVencimentoTaxa = hojeObj.toISOString().split("T")[0];

        await supabase.from("pagamentos").insert({
          matricula_id: selectedMatricula.id,
          valor: valorTaxaNum,
          data_vencimento: dataVencimentoTaxa,
          status: "pendente",
          referencia: "TAXA-MATRICULA",
          unidade_id: currentUnidade.id,
          descricao: "Taxa de Matrícula"
        });
      }

      // C. Disparar E-mail de Matrícula Aprovada
      try {
        const { data: responsavelData } = await supabase
          .from("alunos")
          .select("responsavel:responsavel_id(email, nome)")
          .eq("id", selectedMatricula.aluno_id)
          .single();

        const emailResponsavel = (responsavelData?.responsavel as any)?.email;
        const nomeResponsavel = (responsavelData?.responsavel as any)?.nome || selectedMatricula.aluno?.nome_completo;
        const atividadeName = selectedMatricula.turma?.atividade?.nome || "nossas atividades";

        if (emailResponsavel) {
          await supabase.functions.invoke('send-email', {
            body: {
              to: emailResponsavel,
              type: 'matricula_aprovada',
              data: {
                nomeResponsavel: nomeResponsavel,
                nomeAluno: selectedMatricula.aluno?.nome_completo,
                atividade: atividadeName
              }
            }
          });
        }
      } catch (e) {
        console.error("Erro não fatal ao enviar e-mail de matricula aprovada:", e);
      }

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas_pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["management-matriculas-pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["management-turmas-ocupacao"] });
      toast({ title: "Matrícula Aprovada com Sucesso!" });
      setApproveDialogOpen(false);
      setSelectedMatricula(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro na aprovação", description: error.message, variant: "destructive" });
    }
  });

  // 4. Mutation de Rejeição
  const rejeitarMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMatricula) return;
      const { error } = await supabase
        .from("matriculas")
        .update({ status: "cancelada" })
        .eq("id", selectedMatricula.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas_pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["management-matriculas-pendentes"] });
      toast({ title: "Matrícula Cancelada" });
      setRejectDialogOpen(false);
      setSelectedMatricula(null);
    },
  });

  const handleOpenApprove = (matricula: any) => {
    setSelectedMatricula(matricula);
    setApproveDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Solicitações de Matrícula</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de candidatos aguardando confirmação da Diretoria
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
        ) : !matriculasPendentes?.length ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma solicitação pendente.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matriculasPendentes.map((m: any) => (
              <Card key={m.id} className="border-border/50 shadow-sm hover:border-primary/30 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg tracking-tight">{m.aluno?.nome_completo}</CardTitle>
                    <Badge variant="outline" className="bg-[#FFC200]/10 text-[#FFC200] border-[#FFC200]/20 text-[10px] uppercase font-black">Pendente</Badge>
                  </div>
                  <CardDescription className="text-xs uppercase font-bold tracking-widest mt-1">
                    Em {m.created_at ? format(new Date(m.created_at), "dd/MM") : "Data não informada"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium bg-muted/50 p-2.5 rounded-lg border border-border/40">
                    <span className="text-lg mr-1">📚</span>
                    <span className="truncate">{m.turma?.atividade?.nome} - {m.turma?.nome}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm pt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">CPF: {m.aluno?.cpf || "Não informado"}</span>
                  </div>

                  <div className="flex gap-2 mt-4 pt-2">
                    <Button className="w-full bg-[#E8004F] hover:bg-[#E8004F]/90 text-white font-black" size="sm" onClick={() => handleOpenApprove(m)}>
                      <Check className="mr-2 h-4 w-4" /> APROVAR
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedMatricula(m); setRejectDialogOpen(true); }}>
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
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 bg-background/95 backdrop-blur-xl border border-primary/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="relative shrink-0 h-20 bg-gradient-to-r from-neomissio-primary/10 to-primary/5 flex items-center px-6 z-10 border-b border-white/5">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />
              <div className="relative">
                <DialogTitle className="text-2xl font-bold text-white tracking-tight">Confirmar Matrícula</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs mt-1">
                  Tem certeza que deseja aprovar e ativar a matrícula de <strong>{selectedMatricula?.aluno?.nome_completo}</strong> na turma <strong>{selectedMatricula?.turma?.nome}</strong>?
                </DialogDescription>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
              <div className="py-2 text-sm text-muted-foreground">
                Essa ação irá mudar o status do aluno para ativo, alocar a vaga na turma e emitir a primeira fatura/mensalidade (se houver valor configurado).
              </div>

              <div className="py-4 border-t border-border mt-2 space-y-3">
                <Label className="text-foreground font-bold">Taxa de Matrícula (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">R$</span>
                  <Input
                    value={taxaMatricula}
                    onChange={(e) => {
                      // Aceitar apenas números e vírgula
                      const val = e.target.value.replace(/[^0-9,]/g, "");
                      setTaxaMatricula(val);
                    }}
                    className="pl-8 bg-background font-bold"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Mantenha 0,00 caso não deseje cobrar taxa na entrada deste aluno.
                </p>
              </div>

            </div>

            <DialogFooter className="px-6 py-4 border-t border-primary/10 bg-muted/20 shrink-0">
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={aprovarMutation.isPending}>
                Cancelar
              </Button>
              <Button onClick={() => aprovarMutation.mutate()} disabled={aprovarMutation.isPending} className="bg-[#E8004F] hover:bg-[#E8004F]/90 text-white font-black px-6">
                {aprovarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Confirmar e Ativar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Rejeitar */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] p-0 bg-background/95 backdrop-blur-xl border border-primary/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="relative shrink-0 h-20 bg-gradient-to-r from-destructive/20 to-destructive/5 flex items-center px-6 z-10 border-b border-white/5">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />
              <div className="relative">
                <DialogTitle className="text-2xl font-bold text-white tracking-tight">Recusar Matrícula</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs mt-1">
                  Tem certeza que deseja recusar a solicitação de <strong>{selectedMatricula?.aluno?.nome_completo}</strong>?
                </DialogDescription>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col">
            </div>

            <DialogFooter className="px-6 py-4 border-t border-primary/10 bg-muted/20 shrink-0">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={rejeitarMutation.isPending}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => rejeitarMutation.mutate()} disabled={rejeitarMutation.isPending}>
                {rejeitarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sim, Recusar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MatriculasPendentes;

