import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { handleError } from "@/utils/error-handler";

interface InadimplenteData {
  pagamento_id: string;
  aluno_nome: string;
  aluno_id: string;
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_telefone: string;
  atividade_nome: string;
  turma_nome: string;
  data_vencimento: string;
  valor: number;
  dias_atraso: number;
  total_devido: number;
}

const Inadimplentes = () => {
  const [inadimplentes, setInadimplentes] = useState<InadimplenteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    loadInadimplentes();
  }, []);

  const loadInadimplentes = async () => {
    try {
      setLoading(true);
      const hoje = new Date().toISOString().split("T")[0];

      // Buscar pagamentos pendentes e vencidos
      const { data: pagamentos, error } = await supabase
        .from("pagamentos")
        .select(`
          id,
          data_vencimento,
          valor,
          matricula: matriculas!inner(
            id,
            aluno: alunos!inner(
              id,
              nome_completo,
              responsavel: responsavel_id(
                id,
                nome_completo,
                email,
                telefone
              )
            ),
            turma: turmas!inner(
              nome,
              atividade: atividades!inner(nome)
            )
          )
        `)
        .eq("status", "pendente")
        .lt("data_vencimento", hoje)
        .order("data_vencimento", { ascending: true });

      if (error) throw error;

      // Processar dados e agrupar por aluno/responsável
      const inadimplentesMap = new Map<string, InadimplenteData>();

      pagamentos?.forEach((pag: any) => {
        const key = pag.matricula.aluno.id;
        const diasAtraso = differenceInDays(new Date(), new Date(pag.data_vencimento));

        if (inadimplentesMap.has(key)) {
          const existing = inadimplentesMap.get(key)!;
          existing.total_devido += Number(pag.valor);
          existing.dias_atraso = Math.max(existing.dias_atraso, diasAtraso);
        } else {
          inadimplentesMap.set(key, {
            pagamento_id: pag.id,
            aluno_id: pag.matricula.aluno.id,
            aluno_nome: pag.matricula.aluno.nome_completo,
            responsavel_nome: pag.matricula.aluno.responsavel.nome_completo,
            responsavel_email: pag.matricula.aluno.responsavel.email,
            responsavel_telefone: pag.matricula.aluno.responsavel.telefone || "Não informado",
            atividade_nome: pag.matricula.turma.atividade.nome,
            turma_nome: pag.matricula.turma.nome,
            data_vencimento: pag.data_vencimento,
            valor: Number(pag.valor),
            dias_atraso: diasAtraso,
            total_devido: Number(pag.valor),
          });
        }
      });

      setInadimplentes(Array.from(inadimplentesMap.values()));
    } catch (error) {
      handleError(error, "Não foi possível carregar os inadimplentes");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (inadimplente: InadimplenteData) => {
    try {
      setSendingEmail(inadimplente.aluno_id);

      const { error } = await supabase.functions.invoke("send-payment-reminder", {
        body: {
          to: inadimplente.responsavel_email,
          responsavelNome: inadimplente.responsavel_nome,
          alunoNome: inadimplente.aluno_nome,
          atividadeNome: inadimplente.atividade_nome,
          turmaNome: inadimplente.turma_nome,
          valorDevido: inadimplente.total_devido,
          diasAtraso: inadimplente.dias_atraso,
          dataVencimento: format(new Date(inadimplente.data_vencimento), "dd/MM/yyyy", {
            locale: ptBR,
          }),
        },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Email de cobrança enviado com sucesso",
      });
    } catch (error) {
      handleError(error, "Não foi possível enviar o email de cobrança");
    } finally {
      setSendingEmail(null);
    }
  };

  const getSeveridadeBadge = (diasAtraso: number) => {
    if (diasAtraso > 30) return "destructive";
    if (diasAtraso > 15) return "default";
    return "secondary";
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Alunos Inadimplentes</h1>
            <p className="text-muted-foreground mt-1">
              Gestão de pagamentos em atraso
            </p>
          </div>
          <Button onClick={loadInadimplentes} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              "Atualizar"
            )}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Inadimplentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inadimplentes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Valor Total Devido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {inadimplentes.reduce((sum, item) => sum + item.total_devido, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Maior Atraso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inadimplentes.length > 0
                  ? Math.max(...inadimplentes.map((i) => i.dias_atraso))
                  : 0}{" "}
                dias
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pagamentos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : inadimplentes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum pagamento em atraso
              </p>
            ) : (
              <div className="space-y-4">
                {inadimplentes.map((item) => (
                  <div
                    key={item.aluno_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.aluno_nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        Responsável: {item.responsavel_nome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.atividade_nome} - {item.turma_nome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {format(new Date(item.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={getSeveridadeBadge(item.dias_atraso)}>
                          {item.dias_atraso} dias de atraso
                        </Badge>
                        <Badge variant="outline">
                          R$ {item.total_devido.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        title={`Telefone: ${item.responsavel_telefone}`}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSendEmail(item)}
                        disabled={sendingEmail === item.aluno_id}
                        title="Enviar email de cobrança"
                      >
                        {sendingEmail === item.aluno_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
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

export default Inadimplentes;
