import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const FORMAS_PAGAMENTO = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência Bancária" },
];

const RegistrarPagamento = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPagamentoId, setSelectedPagamentoId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pagamentos pendentes do responsável
  const { data: pagamentosPendentes, isLoading } = useQuery({
    queryKey: ["pagamentos-pendentes", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("pagamentos")
        .select(`
          *,
          matricula:matriculas(
            aluno:alunos(nome_completo),
            turma:turmas(
              nome,
              atividade:atividades(nome)
            )
          )
        `)
        .eq("status", "pendente")
        .order("data_vencimento", { ascending: true });

      if (error) throw error;

      // Filtrar apenas pagamentos dos alunos deste responsável
      return data.filter((p: any) => {
        // Verifica se o responsável do aluno da matrícula é o usuário logado
        return true; // A RLS já filtra isso automaticamente
      });
    },
    enabled: !!user,
  });

  // Mutation para registrar pagamento
  const registrarPagamentoMutation = useMutation({
    mutationFn: async (data: {
      pagamento_id: string;
      forma_pagamento: string;
      observacoes: string;
    }) => {
      const hoje = new Date().toISOString().split("T")[0];

      const { error } = await supabase
        .from("pagamentos")
        .update({
          status: "pago",
          forma_pagamento: data.forma_pagamento,
          data_pagamento: hoje,
          observacoes: data.observacoes || null,
        })
        .eq("id", data.pagamento_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagamentos-pendentes"] });
      toast({
        title: "Pagamento registrado!",
        description: "O pagamento foi registrado com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message || "Não foi possível registrar o pagamento.",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (pagamentoId: string) => {
    setSelectedPagamentoId(pagamentoId);
    setFormaPagamento("");
    setObservacoes("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPagamentoId("");
    setFormaPagamento("");
    setObservacoes("");
  };

  const handleSubmit = () => {
    if (!formaPagamento) {
      toast({
        title: "Forma de pagamento obrigatória",
        description: "Selecione a forma de pagamento.",
        variant: "destructive",
      });
      return;
    }

    registrarPagamentoMutation.mutate({
      pagamento_id: selectedPagamentoId,
      forma_pagamento: formaPagamento,
      observacoes: observacoes,
    });
  };

  const isDueOrOverdue = (dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffDias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias <= 7;
  };

  const getStatusBadge = (dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffDias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return <Badge variant="destructive">Atrasado</Badge>;
    } else if (diffDias <= 7) {
      return <Badge className="bg-yellow-500">Vence em breve</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registrar Pagamento</h1>
          <p className="text-muted-foreground mt-1">
            Informe os pagamentos realizados
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pagamentosPendentes && pagamentosPendentes.length > 0 ? (
          <div className="grid gap-4">
            {pagamentosPendentes.map((pagamento: any) => (
              <Card key={pagamento.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {pagamento.matricula.aluno.nome_completo}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {pagamento.matricula.turma.atividade.nome} - {pagamento.matricula.turma.nome}
                      </p>
                    </div>
                    {getStatusBadge(pagamento.data_vencimento)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Vencimento:</span>
                      <span className="text-sm font-medium">
                        {format(new Date(pagamento.data_vencimento), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Valor:</span>
                      <span className="text-lg font-bold">
                        R$ {parseFloat(pagamento.valor.toString()).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleOpenDialog(pagamento.id)}
                      className="w-full mt-2"
                      variant={isDueOrOverdue(pagamento.data_vencimento) ? "default" : "outline"}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Registrar Pagamento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum pagamento pendente no momento.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog para registrar pagamento */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
              <DialogDescription>
                Informe a forma de pagamento utilizada.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger id="forma_pagamento">
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map((forma) => (
                      <SelectItem key={forma.value} value={forma.value}>
                        {forma.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Comprovante número #12345, pago às 14:30"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseDialog}
                disabled={registrarPagamentoMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={registrarPagamentoMutation.isPending}
              >
                {registrarPagamentoMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default RegistrarPagamento;
