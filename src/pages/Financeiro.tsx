import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

const Financeiro = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground mt-1">
            Controle financeiro completo do projeto
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 24.500</div>
              <p className="text-xs text-muted-foreground">+8% do mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 12.300</div>
              <p className="text-xs text-muted-foreground">Fixas + Variáveis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">R$ 12.200</div>
              <p className="text-xs text-muted-foreground">Margem de 49.8%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">R$ 1.850</div>
              <p className="text-xs text-muted-foreground">8 mensalidades</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Receitas por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { categoria: "Mensalidades", valor: 18600 },
                { categoria: "Locação do Prédio", valor: 4500 },
                { categoria: "Eventos", valor: 1400 },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm">{item.categoria}</span>
                  <span className="font-medium">R$ {item.valor.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { categoria: "Salários", valor: 8500 },
                { categoria: "Manutenção", valor: 2300 },
                { categoria: "Utilities", valor: 1500 },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm">{item.categoria}</span>
                  <span className="font-medium">R$ {item.valor.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Financeiro;
