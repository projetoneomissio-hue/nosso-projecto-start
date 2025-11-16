import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const mockPagamentos = [
  { id: 1, mes: "Janeiro 2024", atividades: "Jiu-Jitsu, Música", valor: 220, status: "pago", vencimento: "05/01/2024" },
  { id: 2, mes: "Fevereiro 2024", atividades: "Jiu-Jitsu, Música", valor: 220, status: "pendente", vencimento: "05/02/2024" },
];

const Pagamentos = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pagamentos</h1>
          <p className="text-muted-foreground mt-1">
            Histórico e mensalidades
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mensalidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPagamentos.map((pagamento) => (
                <div key={pagamento.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{pagamento.mes}</h3>
                    <p className="text-sm text-muted-foreground">{pagamento.atividades}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vencimento: {pagamento.vencimento}
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="text-right">
                      <p className="text-lg font-bold">R$ {pagamento.valor},00</p>
                      <Badge variant={pagamento.status === "pago" ? "default" : "destructive"}>
                        {pagamento.status}
                      </Badge>
                    </div>
                    {pagamento.status === "pago" && (
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {pagamento.status === "pendente" && (
                      <Button size="sm">Pagar</Button>
                    )}
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

export default Pagamentos;
