import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockMatriculas = [
  { id: 1, aluno: "Ana Silva", atividade: "Jiu-Jitsu", status: "ativa", data: "15/01/2024" },
  { id: 2, aluno: "Carlos Oliveira", atividade: "Balé", status: "pendente", data: "20/01/2024" },
  { id: 3, aluno: "Beatriz Costa", atividade: "Música", status: "ativa", data: "10/01/2024" },
];

const Matriculas = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Matrículas</h1>
            <p className="text-muted-foreground mt-1">
              Controle todas as matrículas do projeto
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Matrícula
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Matrículas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockMatriculas.map((matricula) => (
                <div key={matricula.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{matricula.aluno}</h3>
                    <p className="text-sm text-muted-foreground">{matricula.atividade}</p>
                    <p className="text-xs text-muted-foreground mt-1">Data: {matricula.data}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant={matricula.status === "ativa" ? "default" : "secondary"}>
                      {matricula.status}
                    </Badge>
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
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

export default Matriculas;
