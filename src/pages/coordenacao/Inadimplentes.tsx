import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockInadimplentes = [
  { id: 1, aluno: "Pedro Santos", responsavel: "Ana Santos", atividade: "Música", atraso: 15, valor: 120 },
  { id: 2, aluno: "Sofia Lima", responsavel: "Carlos Lima", atividade: "Desenho", atraso: 30, valor: 100 },
];

const Inadimplentes = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alunos Inadimplentes</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de pagamentos em atraso
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pagamentos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockInadimplentes.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{item.aluno}</h3>
                    <p className="text-sm text-muted-foreground">
                      Responsável: {item.responsavel}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.atividade}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="destructive">{item.atraso} dias</Badge>
                      <Badge variant="outline">R$ {item.valor},00</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Mail className="h-4 w-4" />
                    </Button>
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

export default Inadimplentes;
