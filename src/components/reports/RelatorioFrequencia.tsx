import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from "lucide-react";

export const RelatorioFrequencia = () => {
    const { data: relatorioData, isLoading } = useQuery({
        queryKey: ["relatorio-frequencia"],
        queryFn: async () => {
            // Fetch all presences joined with classes
            const { data, error } = await supabase
                .from("presencas")
                .select(`
                    presente,
                    matriculas (
                        turma_id,
                        turmas (nome)
                    )
                `);

            if (error) throw error;

            // Process data: Group by Turma
            const grouped = data.reduce((acc: any, curr: any) => {
                const turmaName = curr.matriculas?.turmas?.nome || "Sem Turma";
                if (!acc[turmaName]) {
                    acc[turmaName] = { name: turmaName, presentes: 0, ausentes: 0 };
                }
                if (curr.presente) {
                    acc[turmaName].presentes++;
                } else {
                    acc[turmaName].ausentes++;
                }
                return acc;
            }, {});

            return Object.values(grouped);
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Frequência por Turma</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={relatorioData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="presentes" name="Presenças" fill="#22c55e" />
                            <Bar dataKey="ausentes" name="Faltas" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
