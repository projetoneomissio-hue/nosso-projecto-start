import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Alunos = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os alunos cadastrados
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Aluno
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: 1, nome: "Ana Silva", atividades: "Jiu-Jitsu, Música", status: "ativa" },
                { id: 2, nome: "Carlos Oliveira", atividades: "Balé", status: "ativa" },
                { id: 3, nome: "Beatriz Costa", atividades: "Desenho, Reforço", status: "ativa" },
              ].map((aluno) => (
                <div key={aluno.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{aluno.nome}</h3>
                    <p className="text-sm text-muted-foreground">{aluno.atividades}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant="default">{aluno.status}</Badge>
                    <Button variant="outline" size="sm">Ver Detalhes</Button>
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

export default Alunos;
