import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const mockAtividades = [
  { id: 1, nome: "Jiu-Jitsu", professor: "Prof. João", horario: "Segunda e Quarta 14h-15h", status: "ativa" },
  { id: 2, nome: "Música", professor: "Prof. Maria", horario: "Terça 15h-16h", status: "ativa" },
];

const AtividadesMatriculadas = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atividades Matriculadas</h1>
          <p className="text-muted-foreground mt-1">
            Atividades do seu filho(a)
          </p>
        </div>

        <div className="grid gap-6">
          {mockAtividades.map((atividade) => (
            <Card key={atividade.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{atividade.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {atividade.professor}
                    </p>
                    <p className="text-sm text-muted-foreground">{atividade.horario}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="default">{atividade.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AtividadesMatriculadas;
