import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar } from "lucide-react";

const Predio = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão do Prédio</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie custos, funcionários e locações
          </p>
        </div>

        <Tabs defaultValue="custos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="custos">Custos</TabsTrigger>
            <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
            <TabsTrigger value="locacoes">Locações</TabsTrigger>
          </TabsList>

          <TabsContent value="custos">
            <Card>
              <CardHeader>
                <CardTitle>Custos Mensais do Prédio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { item: "Energia Elétrica", valor: 850, tipo: "fixo" },
                    { item: "Água", valor: 320, tipo: "fixo" },
                    { item: "Internet", valor: 180, tipo: "fixo" },
                    { item: "Segurança", valor: 1200, tipo: "fixo" },
                    { item: "Limpeza", valor: 600, tipo: "variavel" },
                    { item: "Manutenção", valor: 450, tipo: "variavel" },
                  ].map((custo, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{custo.item}</p>
                        <Badge variant="secondary" className="mt-1">{custo.tipo}</Badge>
                      </div>
                      <p className="text-lg font-bold">R$ {custo.valor}</p>
                    </div>
                  ))}
                  <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                    <span>Total Mensal:</span>
                    <span>R$ 3.600</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funcionarios">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Funcionários</CardTitle>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Funcionário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { nome: "José Silva", funcao: "Zelador", salario: 1800 },
                    { nome: "Maria Santos", funcao: "Limpeza", salario: 1600 },
                    { nome: "Pedro Costa", funcao: "Segurança", salario: 2200 },
                  ].map((func, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{func.nome}</h3>
                        <p className="text-sm text-muted-foreground">{func.funcao}</p>
                      </div>
                      <p className="font-bold">R$ {func.salario}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locacoes">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Locações Agendadas</CardTitle>
                  <Button className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Nova Locação
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { evento: "Aniversário - Maria", data: "28/01/2024", horario: "14h-18h", valor: 800 },
                    { evento: "Workshop Yoga", data: "03/02/2024", horario: "9h-13h", valor: 600 },
                    { evento: "Palestra Educação", data: "10/02/2024", horario: "19h-22h", valor: 500 },
                  ].map((locacao, i) => (
                    <div key={i} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{locacao.evento}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            {locacao.data} • {locacao.horario}
                          </p>
                        </div>
                        <Badge variant="default">R$ {locacao.valor}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Predio;
