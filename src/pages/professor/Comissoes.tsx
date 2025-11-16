import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp } from "lucide-react";

const mockComissoes = [
  { mes: "Janeiro 2024", totalAlunos: 12, valorPorAluno: 120, percentual: 15, total: 216, status: "pago" },
  { mes: "Fevereiro 2024", totalAlunos: 15, valorPorAluno: 120, percentual: 15, total: 270, status: "pendente" },
];

const Comissoes = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Comissões</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe seus ganhos mensais
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Este Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 270,00</div>
              <p className="text-xs text-muted-foreground">15 alunos ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Percentual</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15%</div>
              <p className="text-xs text-muted-foreground">Por aluno matriculado</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockComissoes.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{item.mes}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.totalAlunos} alunos × R$ {item.valorPorAluno} × {item.percentual}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">R$ {item.total},00</p>
                    <Badge variant={item.status === "pago" ? "default" : "secondary"}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Comissoes;
