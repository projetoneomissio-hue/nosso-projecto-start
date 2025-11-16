import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const relatoriosDisponiveis = [
  { id: 1, nome: "Relatório de Matrículas", tipo: "Mensal", data: "Janeiro 2024" },
  { id: 2, nome: "Relatório Financeiro", tipo: "Mensal", data: "Janeiro 2024" },
  { id: 3, nome: "Relatório de Frequência", tipo: "Semanal", data: "Semana 4" },
  { id: 4, nome: "Relatório de Inadimplência", tipo: "Mensal", data: "Janeiro 2024" },
];

const Relatorios = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Gere e baixe relatórios do sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatoriosDisponiveis.map((relatorio) => (
                <div key={relatorio.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{relatorio.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {relatorio.tipo} - {relatorio.data}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Baixar
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

export default Relatorios;
