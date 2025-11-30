import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Aluno {
  id: string;
  nome_completo: string;
}

interface Observacao {
  id: string;
  data: string;
  tipo: string;
  observacao: string;
  professor: {
    user_id: string;
    profiles: {
      nome_completo: string;
    };
  };
  turma: {
    nome: string;
    atividade: {
      nome: string;
    };
  };
}

interface FrequenciaData {
  turma_nome: string;
  atividade_nome: string;
  presencas: number;
  total: number;
  percentual: number;
  matricula_id: string;
}

interface ChartData {
  mes: string;
  percentual: number;
}

const RelatoriosAluno = () => {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>("");
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);
  const [frequencias, setFrequencias] = useState<FrequenciaData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadAlunos();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAlunoId) {
      loadObservacoes();
      loadFrequencia();
    }
  }, [selectedAlunoId]);

  const loadAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from("alunos")
        .select("id, nome_completo")
        .eq("responsavel_id", user?.id)
        .order("nome_completo");

      if (error) throw error;
      setAlunos(data || []);
      if (data && data.length > 0) {
        setSelectedAlunoId(data[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os alunos",
        variant: "destructive",
      });
    }
  };

  const loadObservacoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("observacoes")
        .select(`
          id,
          data,
          tipo,
          observacao,
          professor:professores!inner(
            user_id,
            profiles:user_id(nome_completo)
          ),
          turma:turmas!inner(
            nome,
            atividade:atividades!inner(nome)
          )
        `)
        .eq("aluno_id", selectedAlunoId)
        .order("data", { ascending: false })
        .limit(20);

      if (error) throw error;
      setObservacoes(data || []);
    } catch (error) {
      console.error("Erro ao carregar observações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as observações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFrequencia = async () => {
    try {
      setLoading(true);
      
      // Buscar matrículas do aluno
      const { data: matriculas, error: matriculasError } = await supabase
        .from("matriculas")
        .select(`
          id,
          turma:turmas!inner(
            nome,
            atividade:atividades!inner(nome)
          )
        `)
        .eq("aluno_id", selectedAlunoId)
        .eq("status", "ativa");

      if (matriculasError) throw matriculasError;

      if (!matriculas || matriculas.length === 0) {
        setFrequencias([]);
        setChartData([]);
        return;
      }

      // Buscar presenças para cada matrícula
      const frequenciasPromises = matriculas.map(async (matricula) => {
        const { data: presencas, error: presencasError } = await supabase
          .from("presencas")
          .select("presente, data")
          .eq("matricula_id", matricula.id);

        if (presencasError) throw presencasError;

        const total = presencas?.length || 0;
        const presentes = presencas?.filter((p) => p.presente).length || 0;
        const percentual = total > 0 ? Math.round((presentes / total) * 100) : 0;

        return {
          turma_nome: matricula.turma.nome,
          atividade_nome: matricula.turma.atividade.nome,
          presencas: presentes,
          total,
          percentual,
          matricula_id: matricula.id,
        };
      });

      const frequenciasData = await Promise.all(frequenciasPromises);
      setFrequencias(frequenciasData);

      // Calcular dados do gráfico mensal (últimos 6 meses)
      const hoje = new Date();
      const seiseMesesAtras = subMonths(hoje, 5);
      const meses = eachMonthOfInterval({ start: seiseMesesAtras, end: hoje });

      const chartDataPromises = meses.map(async (mes) => {
        const inicio = startOfMonth(mes);
        const fim = endOfMonth(mes);

        // Buscar todas as presenças do período para todas as matrículas
        const presencasPromises = matriculas.map(async (matricula) => {
          const { data: presencas } = await supabase
            .from("presencas")
            .select("presente")
            .eq("matricula_id", matricula.id)
            .gte("data", inicio.toISOString())
            .lte("data", fim.toISOString());

          return presencas || [];
        });

        const todasPresencas = (await Promise.all(presencasPromises)).flat();
        const total = todasPresencas.length;
        const presentes = todasPresencas.filter((p) => p.presente).length;
        const percentual = total > 0 ? Math.round((presentes / total) * 100) : 0;

        return {
          mes: format(mes, "MMM", { locale: ptBR }),
          percentual,
        };
      });

      const chartDataResult = await Promise.all(chartDataPromises);
      setChartData(chartDataResult);
    } catch (error) {
      console.error("Erro ao carregar frequência:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a frequência",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios do Aluno</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o desenvolvimento e frequência
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecione o Aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAlunoId} onValueChange={setSelectedAlunoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {alunos.map((aluno) => (
                  <SelectItem key={aluno.id} value={aluno.id}>
                    {aluno.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedAlunoId && (
          <Tabs defaultValue="observacoes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="observacoes">Observações</TabsTrigger>
              <TabsTrigger value="frequencia">Frequência</TabsTrigger>
            </TabsList>

            <TabsContent value="observacoes">
              <Card>
                <CardHeader>
                  <CardTitle>Observações dos Professores</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : observacoes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma observação registrada
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {observacoes.map((obs) => (
                        <div key={obs.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">{obs.turma.atividade.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {obs.professor.profiles.nome_completo}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(obs.data), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                {obs.tipo}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm">{obs.observacao}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="frequencia" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Frequência Mensal (Últimos 6 Meses)</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : chartData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Sem dados de frequência
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="percentual"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Frequência (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Frequência por Atividade</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : frequencias.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma matrícula ativa encontrada
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {frequencias.map((freq) => (
                        <div key={freq.matricula_id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="font-semibold">{freq.atividade_nome}</p>
                              <p className="text-sm text-muted-foreground">{freq.turma_nome}</p>
                            </div>
                            <p className="text-lg font-bold text-primary">{freq.percentual}%</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {freq.presencas} presenças de {freq.total} aulas
                          </p>
                          <div className="mt-2 w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${freq.percentual}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RelatoriosAluno;
