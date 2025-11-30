import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, Calendar, Plus } from "lucide-react";

const mockTurmas = [
  {
    id: "1",
    nome: "Futebol Infantil - Manhã",
    atividade: "Futebol",
    horario: "08:00 - 09:30",
    dias: ["Segunda", "Quarta", "Sexta"],
    professor: "João Silva",
    alunos_matriculados: 15,
    capacidade_maxima: 20,
    status: "ativa"
  },
  {
    id: "2",
    nome: "Futebol Juvenil - Tarde",
    atividade: "Futebol",
    horario: "14:00 - 15:30",
    dias: ["Terça", "Quinta"],
    professor: "Maria Santos",
    alunos_matriculados: 18,
    capacidade_maxima: 20,
    status: "ativa"
  },
  {
    id: "3",
    nome: "Futebol Adulto - Noite",
    atividade: "Futebol",
    horario: "19:00 - 20:30",
    dias: ["Segunda", "Quarta"],
    professor: "Carlos Oliveira",
    alunos_matriculados: 12,
    capacidade_maxima: 15,
    status: "ativa"
  }
];

const Turmas = () => {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Turmas</h1>
            <p className="text-muted-foreground">
              Gerencie as turmas das suas atividades
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Turma
          </Button>
        </div>

        <div className="grid gap-4">
          {mockTurmas.map((turma) => (
            <Card key={turma.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{turma.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Professor: {turma.professor}
                    </p>
                  </div>
                  <Badge variant={turma.status === "ativa" ? "default" : "secondary"}>
                    {turma.status === "ativa" ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{turma.horario}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{turma.dias.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {turma.alunos_matriculados}/{turma.capacidade_maxima} alunos
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
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
