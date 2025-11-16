import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Users, User, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Atividades = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Atividades</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as atividades oferecidas
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Atividade
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { id: 1, nome: "Jiu-Jitsu", alunos: 45, professor: "Prof. João Silva", horarios: "Seg/Qua/Sex 14h-16h" },
            { id: 2, nome: "Balé", alunos: 38, professor: "Prof. Maria Santos", horarios: "Ter/Qui 15h-17h" },
            { id: 3, nome: "Música", alunos: 25, professor: "Prof. Pedro Costa", horarios: "Qua/Sex 16h-18h" },
            { id: 4, nome: "Desenho", alunos: 20, professor: "Prof. Ana Lima", horarios: "Seg/Qua 10h-12h" },
            { id: 5, nome: "Reforço Escolar", alunos: 32, professor: "Prof. Carlos Souza", horarios: "Diário 13h-15h" },
            { id: 6, nome: "Pilates", alunos: 15, professor: "Prof. Julia Rocha", horarios: "Ter/Qui 9h-11h" },
          ].map((atividade) => (
            <Card key={atividade.id}>
              <CardHeader>
                <CardTitle className="text-lg">{atividade.nome}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{atividade.alunos} alunos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{atividade.professor}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{atividade.horarios}</span>
                </div>
                <Button variant="outline" className="w-full mt-2">Ver Detalhes</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Atividades;
