import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Link as LinkIcon, Copy, CheckCircle, Search, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const GerarLinkPagamento = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch pagamentos pendentes
  const { data: pagamentos, isLoading } = useQuery({
    queryKey: ["pagamentos-pendentes-link"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos")
        .select(`
          id, valor, data_vencimento, status,
          matricula:matriculas!inner(
            aluno:alunos!inner(
              nome_completo,
              responsavel:profiles!alunos_responsavel_id_fkey(email, telefone)
            ),
            turma:turmas!inner(
              nome,
              atividade:atividades!inner(nome)
            )
          )
        `)
        .in("status", ["pendente", "atrasado"])
        .order("data_vencimento", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Mutation para gerar link de pagamento
  const gerarLinkMutation = useMutation({
    mutationFn: async (pagamentoId: string) => {
      const { data, error } = await supabase.functions.invoke("create-payment-link", {
        body: { pagamentoId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, pagamentoId) => {
      setGeneratedLinks((prev) => ({ ...prev, [pagamentoId]: data.url }));
      toast({
        title: "Link gerado!",
        description: "O link de pagamento foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopyLink = (pagamentoId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(pagamentoId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  const filteredPagamentos = pagamentos?.filter((p) => {
    const matricula = p.matricula as any;
    const searchLower = searchTerm.toLowerCase();
    return (
      matricula.aluno.nome_completo.toLowerCase().includes(searchLower) ||
      matricula.turma.atividade.nome.toLowerCase().includes(searchLower)
    );
  });

  const isOverdue = (dataVencimento: string) => {
    return new Date(dataVencimento) < new Date();
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerar Link de Pagamento</h1>
          <p className="text-muted-foreground mt-1">
            Crie links de pagamento PIX/Cartão para enviar aos responsáveis
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por aluno ou atividade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPagamentos && filteredPagamentos.length > 0 ? (
          <div className="space-y-4">
            {filteredPagamentos.map((pagamento) => {
              const matricula = pagamento.matricula as any;
              const aluno = matricula.aluno;
              const turma = matricula.turma;
              const atividade = turma.atividade;
              const linkUrl = generatedLinks[pagamento.id];
              const overdue = isOverdue(pagamento.data_vencimento);

              return (
                <Card key={pagamento.id} className={overdue ? "border-destructive" : ""}>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{aluno.nome_completo}</h3>
                          {overdue ? (
                            <Badge variant="destructive">Atrasado</Badge>
                          ) : (
                            <Badge variant="outline">Pendente</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {atividade.nome} - {turma.nome}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>
                            Vencimento: {format(new Date(pagamento.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          {aluno.responsavel?.email && (
                            <span>Email: {aluno.responsavel.email}</span>
                          )}
                          {aluno.responsavel?.telefone && (
                            <span>Tel: {aluno.responsavel.telefone}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            R$ {parseFloat(pagamento.valor.toString()).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {linkUrl ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyLink(pagamento.id, linkUrl)}
                              >
                                {copiedId === pagamento.id ? (
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-1" />
                                )}
                                Copiar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <a href={linkUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Abrir
                                </a>
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => gerarLinkMutation.mutate(pagamento.id)}
                              disabled={gerarLinkMutation.isPending}
                              size="sm"
                            >
                              {gerarLinkMutation.isPending && gerarLinkMutation.variables === pagamento.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <LinkIcon className="h-4 w-4 mr-1" />
                              )}
                              Gerar Link
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {linkUrl && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Link de Pagamento:</p>
                        <code className="text-xs bg-muted p-2 rounded block break-all">{linkUrl}</code>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum pagamento encontrado." : "Nenhum pagamento pendente."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GerarLinkPagamento;
