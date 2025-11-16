import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const Anamnese = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Anamnese Esportiva</h1>
          <p className="text-muted-foreground mt-1">
            Preencha as informações de saúde do aluno
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Questionário de Saúde</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Condições de Saúde</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="cardiaco" />
                <label htmlFor="cardiaco" className="text-sm font-medium leading-none">
                  Possui problemas cardíacos?
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="respiratorio" />
                <label htmlFor="respiratorio" className="text-sm font-medium leading-none">
                  Possui problemas respiratórios (asma, bronquite)?
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="osseo" />
                <label htmlFor="osseo" className="text-sm font-medium leading-none">
                  Possui problemas ósseos ou articulares?
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="alergia" />
                <label htmlFor="alergia" className="text-sm font-medium leading-none">
                  Possui alergias?
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="medicamento" />
                <label htmlFor="medicamento" className="text-sm font-medium leading-none">
                  Faz uso contínuo de medicamentos?
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações Adicionais</Label>
              <Textarea
                id="observacoes"
                placeholder="Informe qualquer condição de saúde relevante, cirurgias recentes, limitações físicas, etc."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencia">Contato de Emergência</Label>
              <Textarea
                id="emergencia"
                placeholder="Nome e telefone de contato em caso de emergência"
                className="min-h-[80px]"
              />
            </div>

            <Button className="w-full">Salvar Anamnese</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Anamnese;
