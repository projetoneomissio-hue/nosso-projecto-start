import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

const mockAlunos = [
  { id: 1, nome: "Ana Silva" },
  { id: 2, nome: "Carlos Oliveira" },
  { id: 3, nome: "Beatriz Costa" },
  { id: 4, nome: "Pedro Santos" },
];

const Presenca = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registro de Presença</h1>
          <p className="text-muted-foreground mt-1">
            Marque a presença dos alunos
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Selecione a Data</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Presença - Jiu-Jitsu Iniciante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAlunos.map((aluno) => (
                  <div key={aluno.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox id={`aluno-${aluno.id}`} />
                    <label
                      htmlFor={`aluno-${aluno.id}`}
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {aluno.nome}
                    </label>
                  </div>
                ))}
                <Button className="w-full mt-4">Salvar Presença</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Presenca;
