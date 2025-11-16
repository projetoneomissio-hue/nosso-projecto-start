import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockObservacoes = [
  { data: "20/01/2024", professor: "Prof. João", atividade: "Jiu-Jitsu", texto: "Aluno demonstrou boa evolução nas técnicas de queda." },
  { data: "18/01/2024", professor: "Prof. Maria", atividade: "Música", texto: "Excelente dedicação durante as aulas de teoria musical." },
];

const mockFrequencia = [
  { atividade: "Jiu-Jitsu", presencas: 7, total: 8, percentual: 87.5 },
  { atividade: "Música", presencas: 4, total: 4, percentual: 100 },
];

const RelatoriosAluno = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios do Aluno</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o desenvolvimento
          </p>
        </div>

        <Tabs defaultValue="observacoes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="observacoes">Observações</TabsTrigger>
            <TabsTrigger value="frequencia">Frequência</TabsTrigger>
          </TabsList>

          <TabsContent value="observacoes">
            <Card>
              <CardHeader>
                <CardTitle>Observações dos Professores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockObservacoes.map((obs, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{obs.atividade}</p>
                          <p className="text-sm text-muted-foreground">{obs.professor}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{obs.data}</p>
                      </div>
                      <p className="text-sm">{obs.texto}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="frequencia">
            <Card>
              <CardHeader>
                <CardTitle>Frequência por Atividade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockFrequencia.map((freq, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold">{freq.atividade}</p>
                        <p className="text-lg font-bold text-primary">{freq.percentual}%</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {freq.presencas} presenças de {freq.total} aulas
                      </p>
                      <div className="mt-2 w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${freq.percentual}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RelatoriosAluno;
