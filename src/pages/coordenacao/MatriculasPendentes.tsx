import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockPendentes = [
  { id: 1, aluno: "Lucas Ferreira", atividade: "Jiu-Jitsu", data: "22/01/2024", responsavel: "Maria Ferreira" },
  { id: 2, aluno: "Julia Mendes", atividade: "Balé", data: "23/01/2024", responsavel: "João Mendes" },
];

const MatriculasPendentes = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Matrículas Pendentes</h1>
          <p className="text-muted-foreground mt-1">
            Aprovar ou rejeitar novas solicitações
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aguardando Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPendentes.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{item.aluno}</h3>
                    <p className="text-sm text-muted-foreground">{item.atividade}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Responsável: {item.responsavel} • {item.data}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-2">
                      <Check className="h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <X className="h-4 w-4" />
                      Rejeitar
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

export default MatriculasPendentes;
