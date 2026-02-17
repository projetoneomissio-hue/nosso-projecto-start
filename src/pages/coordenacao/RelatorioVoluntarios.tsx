import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, Clock, DollarSign, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const RelatorioVoluntarios = () => {
    // 1. Fetch Volunteer Professors
    const { data: voluntarios, isLoading } = useQuery({
        queryKey: ["relatorio-voluntarios"],
        queryFn: async () => {
            // Get professors marked as volunteer
            const { data: profs, error: profError } = await supabase
                .from("professores")
                .select(`
                    id, 
                    user_id,
                    especialidade,
                    user:profiles(nome_completo, email),
                    turmas(
                        id,
                        nome,
                        horario,
                        matriculas(count)
                    )
                `)
                .eq("is_volunteer", true)
                .eq("ativo", true);

            if (profError) throw profError;

            // For each volunteer, we want to estimate hours donated.
            // Metric: Count distinct dates in 'presencas' for their turmas.
            // Assumption: 1 class = 1 hour (unless parsed from horario)

            const reportData = await Promise.all(profs.map(async (prof) => {
                const turmaIds = prof.turmas?.map(t => t.id) || [];

                if (turmaIds.length === 0) {
                    return {
                        ...prof,
                        totalAulas: 0,
                        totalHoras: 0
                    };
                }

                // Get distinct dates from presence records for these turmas
                // Note: presencas links to matricula_id -> turma_id
                // We need to join: presencas -> matriculas -> turma_id

                const { data: presencas, error: presError } = await supabase
                    .from("presencas")
                    .select(`
                        data,
                        matricula:matriculas(turma_id)
                    `)
                    .in("matricula.turma_id", turmaIds); // This filter might not work directly on joined col in simple query without !inner or specialized logic

                // Alternative: Get all matriculas for these turmas first
                const { data: matriculas } = await supabase
                    .from("matriculas")
                    .select("id, turma_id")
                    .in("turma_id", turmaIds);

                const matriculaIds = matriculas?.map(m => m.id) || [];

                let uniqueDatesCount = 0;

                if (matriculaIds.length > 0) {
                    const { data: presencasData } = await supabase
                        .from("presencas")
                        .select("data, matricula_id")
                        .in("matricula_id", matriculaIds);

                    // Helper map: Date -> Set of Turmas
                    const classesHeld = new Set<string>(); // "YYYY-MM-DD__TURMA_ID"

                    presencasData?.forEach(p => {
                        const mat = matriculas?.find(m => m.id === p.matricula_id);
                        if (mat) {
                            classesHeld.add(`${p.data}__${mat.turma_id}`);
                        }
                    });

                    uniqueDatesCount = classesHeld.size;
                }

                // Estimate hours
                // Ideally parse prof.turmas.horario
                // For now, assume 1h per class
                const totalHoras = uniqueDatesCount * 1;

                return {
                    ...prof,
                    totalAulas: uniqueDatesCount,
                    totalHoras: totalHoras,
                    studentCount: prof.turmas?.reduce((acc: number, t: any) => acc + (t.matriculas?.[0]?.count || 0), 0)
                };
            }));

            return reportData;
        }
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Relatório de Voluntários</h1>
                        <p className="text-muted-foreground">
                            Acompanhamento de horas doadas por professores voluntários.
                        </p>
                    </div>
                    <Button onClick={handlePrint} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Imprimir / PDF
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Horas Doadas (Estimado)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {voluntarios && voluntarios.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Voluntário</TableHead>
                                            <TableHead>Especialidade</TableHead>
                                            <TableHead className="text-center">Turmas Ativas</TableHead>
                                            <TableHead className="text-center">Alunos</TableHead>
                                            <TableHead className="text-center">Aulas Ministradas</TableHead>
                                            <TableHead className="text-right">Horas Doadas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {voluntarios.map((vol) => (
                                            <TableRow key={vol.id}>
                                                <TableCell className="font-medium">
                                                    {vol.user?.nome_completo}
                                                    <div className="text-xs text-muted-foreground">{vol.user?.email}</div>
                                                </TableCell>
                                                <TableCell>{vol.especialidade || "-"}</TableCell>
                                                <TableCell className="text-center">
                                                    {vol.turmas?.length || 0}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {vol.studentCount || 0}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                                        {vol.totalAulas}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    <div className="flex items-center justify-end gap-1 text-green-600">
                                                        <Clock className="h-3 w-3" />
                                                        {vol.totalHoras}h
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    Nenhum professor voluntário encontrado.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default RelatorioVoluntarios;
