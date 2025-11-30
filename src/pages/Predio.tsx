import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Predio = () => {
  const { data: custos, isLoading: loadingCustos } = useQuery({
    queryKey: ["custos-predio"],
    queryFn: async () => {
      const now = new Date();
      const currentMonth = format(now, "yyyy-MM");

      const { data, error } = await supabase
        .from("custos_predio")
        .select("*")
        .gte("data_competencia", `${currentMonth}-01`)
        .order("data_competencia", { ascending: false });

      if (error) throw error;

      const total = (data || []).reduce((acc, c) => acc + Number(c.valor), 0);
      return { items: data || [], total };
    },
  });

  const { data: funcionarios, isLoading: loadingFunc } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data || [];
    },
  });

  const { data: locacoes, isLoading: loadingLoc } = useQuery({
    queryKey: ["locacoes"],
    queryFn: async () => {
      const now = new Date();
      const currentMonth = format(now, "yyyy-MM");

      const { data, error } = await supabase
        .from("locacoes")
        .select("*")
        .gte("data", `${currentMonth}-01`)
        .order("data", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const getTipoLabel = (tipo: string) => {
    return tipo === "fixo" ? "Fixo" : "Variável";
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão do Prédio</h1>
          <p className="text-muted-foreground mt-1">
            Controle de custos, funcionários e locações
          </p>
        </div>

        <Tabs defaultValue="custos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="custos">Custos</TabsTrigger>
            <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
            <TabsTrigger value="locacoes">Locações</TabsTrigger>
          </TabsList>

          <TabsContent value="custos" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Custos Mensais do Prédio</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Custo
              </Button>
            </div>

            {loadingCustos ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4">
                  {custos?.items.map((custo) => (
                    <Card key={custo.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{custo.item}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(custo.data_competencia), "MMMM yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            R$ {Number(custo.valor).toFixed(2).replace(".", ",")}
                          </p>
                          <Badge variant="secondary">{getTipoLabel(custo.tipo)}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Total Mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      R$ {custos?.total.toFixed(2).replace(".", ",")}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="funcionarios" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Funcionários do Prédio</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Funcionário
              </Button>
            </div>

            {loadingFunc ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !funcionarios || funcionarios.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Nenhum funcionário cadastrado
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {funcionarios.map((func) => (
                  <Card key={func.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{func.nome}</h3>
                        <p className="text-sm text-muted-foreground">{func.funcao}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          R$ {Number(func.salario).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="locacoes" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Locações Agendadas</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Locação
              </Button>
            </div>

            {loadingLoc ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !locacoes || locacoes.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Nenhuma locação agendada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {locacoes.map((loc) => (
                  <Card key={loc.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{loc.evento}</h3>
                          <p className="text-sm text-muted-foreground">
                            {loc.responsavel_nome}
                          </p>
                        </div>
                        <p className="text-lg font-bold">
                          R$ {Number(loc.valor).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>
                          Data: {format(new Date(loc.data), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        <p>
                          Horário: {loc.horario_inicio} - {loc.horario_fim}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Predio;
