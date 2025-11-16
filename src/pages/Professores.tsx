import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Professores = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Professores</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie professores e comissões
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Professor
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Professores Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: 1, nome: "João Silva", atividade: "Jiu-Jitsu", alunos: 45, comissao: 810 },
                { id: 2, nome: "Maria Santos", atividade: "Balé", alunos: 38, comissao: 684 },
                { id: 3, nome: "Pedro Costa", atividade: "Música", alunos: 25, comissao: 450 },
                { id: 4, nome: "Ana Lima", atividade: "Desenho", alunos: 20, comissao: 360 },
                { id: 5, nome: "Carlos Souza", atividade: "Reforço Escolar", alunos: 32, comissao: 432 },
              ].map((prof) => (
                <div key={prof.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{prof.nome}</h3>
                    <p className="text-sm text-muted-foreground">{prof.atividade}</p>
                    <p className="text-xs text-muted-foreground mt-1">{prof.alunos} alunos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Comissão mensal</p>
                    <p className="text-lg font-bold">R$ {prof.comissao}</p>
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

export default Professores;
