import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NovaMatricula = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nova Matrícula</h1>
          <p className="text-muted-foreground mt-1">
            Inscreva seu filho em uma atividade
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Matrícula</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aluno">Nome do Aluno</Label>
              <Input id="aluno" placeholder="Nome completo" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nascimento">Data de Nascimento</Label>
                <Input id="nascimento" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" placeholder="000.000.000-00" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="atividade">Atividade</Label>
              <Select>
                <SelectTrigger id="atividade">
                  <SelectValue placeholder="Selecione uma atividade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jiujitsu">Jiu-Jitsu</SelectItem>
                  <SelectItem value="bale">Balé</SelectItem>
                  <SelectItem value="musica">Música</SelectItem>
                  <SelectItem value="desenho">Desenho</SelectItem>
                  <SelectItem value="reforco">Reforço Escolar</SelectItem>
                  <SelectItem value="pilates">Pilates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="turma">Turma/Horário</Label>
              <Select>
                <SelectTrigger id="turma">
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seg-qua-14">Segunda e Quarta 14h-15h</SelectItem>
                  <SelectItem value="ter-qui-15">Terça e Quinta 15h-16h</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <Button className="w-full">Solicitar Matrícula</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NovaMatricula;
