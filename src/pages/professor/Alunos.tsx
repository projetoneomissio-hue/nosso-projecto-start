import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mockAlunos = [
  { id: 1, nome: "Ana Silva", turma: "Jiu-Jitsu Iniciante", frequencia: 90 },
  { id: 2, nome: "Carlos Oliveira", turma: "Jiu-Jitsu Iniciante", frequencia: 85 },
  { id: 3, nome: "Beatriz Costa", turma: "Jiu-Jitsu Avançado", frequencia: 95 },
];

const Alunos = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lista de Alunos</h1>
          <p className="text-muted-foreground mt-1">
            Todos os alunos das suas turmas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alunos Matriculados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAlunos.map((aluno) => (
                <div key={aluno.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{aluno.nome.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{aluno.nome}</h3>
                      <p className="text-sm text-muted-foreground">{aluno.turma}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Frequência: {aluno.frequencia}%
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
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
