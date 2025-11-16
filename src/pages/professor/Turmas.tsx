import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const mockTurmas = [
  { id: 1, nome: "Jiu-Jitsu Iniciante", horario: "Segunda e Quarta 14h-15h", alunos: 12, vagas: 15 },
  { id: 2, nome: "Jiu-Jitsu Avançado", horario: "Terça e Quinta 15h-16h", alunos: 8, vagas: 10 },
];

const Turmas = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Turmas</h1>
          <p className="text-muted-foreground mt-1">
            Turmas sob sua responsabilidade
          </p>
        </div>

        <div className="grid gap-6">
          {mockTurmas.map((turma) => (
            <Card key={turma.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{turma.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{turma.horario}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Badge variant="secondary">
                    {turma.alunos} / {turma.vagas} alunos
                  </Badge>
                  <Badge variant={turma.alunos < turma.vagas ? "default" : "destructive"}>
                    {turma.vagas - turma.alunos > 0 ? `${turma.vagas - turma.alunos} vagas` : "Lotado"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Turmas;
