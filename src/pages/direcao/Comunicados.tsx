import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Construction } from "lucide-react";

const Comunicados = () => {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Comunicados</h1>
                    <p className="text-muted-foreground">
                        Envie comunicados para responsáveis, turmas ou alunos específicos
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Construction className="h-5 w-5" />
                            Em Desenvolvimento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <Megaphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                Funcionalidade em construção
                            </h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                O sistema de comunicados está sendo desenvolvido. 
                                Em breve você poderá enviar avisos para responsáveis, 
                                turmas específicas ou alunos individuais.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Comunicados;
