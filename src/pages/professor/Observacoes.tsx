import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Observacoes = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Observações e Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Registre o desenvolvimento dos alunos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nova Observação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aluno">Selecione o Aluno</Label>
              <Select>
                <SelectTrigger id="aluno">
                  <SelectValue placeholder="Escolha um aluno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Ana Silva</SelectItem>
                  <SelectItem value="2">Carlos Oliveira</SelectItem>
                  <SelectItem value="3">Beatriz Costa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Observação</Label>
              <Select>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Escolha o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desempenho">Desempenho</SelectItem>
                  <SelectItem value="comportamento">Comportamento</SelectItem>
                  <SelectItem value="evolucao">Evolução Técnica</SelectItem>
                  <SelectItem value="geral">Observação Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea
                id="observacao"
                placeholder="Descreva suas observações sobre o aluno..."
                className="min-h-[150px]"
              />
            </div>

            <Button className="w-full">Salvar Observação</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Observacoes;
