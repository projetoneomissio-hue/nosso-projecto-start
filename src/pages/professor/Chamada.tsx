import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Chamada = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [attendance, setAttendance] = useState<Record<string, boolean>>({});
    const [observations, setObservations] = useState<Record<string, string>>({});

    // 1. Fetch Turmas assigned to this professor
    const { data: turmas, isLoading: loadingTurmas } = useQuery({
        queryKey: ["professor-turmas", user?.id],
        queryFn: async () => {
            // Find professor record linked to user
            const { data: profData } = await supabase
                .from("professores")
                .select("id")
                .eq("user_id", user?.id)
                .single();

            if (!profData) return [];

            const { data: turmasData, error } = await supabase
                .from("turmas")
                .select("id, nome, horario, dias_semana, atividades(nome)")
                .eq("professor_id", profData.id)
                .eq("ativa", true);

            if (error) throw error;
            return turmasData;
        },
        enabled: !!user,
    });

    // 2. Fetch Students + Existing Attendance for selected Class & Date
    const { data: studentsData, isLoading: loadingStudents } = useQuery({
        queryKey: ["chamada-students", selectedTurmaId, date],
        queryFn: async () => {
            if (!selectedTurmaId) return { matriculas: [] };

            // Get Students
            const { data: matriculas, error: matError } = await supabase
                .from("matriculas")
                .select(`
                    id,
                    aluno_id,
                    alunos(id, nome_completo)
                `)
                .eq("turma_id", selectedTurmaId)
                .eq("status", "ativa");

            if (matError) throw matError;

            // Get Existing Attendance using presencas table
            const { data: presencas, error: presError } = await supabase
                .from("presencas")
                .select("*")
                .in("matricula_id", matriculas?.map(m => m.id) || [])
                .eq("data", date);

            if (presError) throw presError;

            // Initialize state from DB or Default to True (Present)
            const initialAttendance: Record<string, boolean> = {};
            const initialObs: Record<string, string> = {};

            matriculas?.forEach(m => {
                const record = presencas?.find(p => p.matricula_id === m.id);
                // If record exists, use it. If not, default to TRUE (Assuming presence)
                initialAttendance[m.id] = record ? record.presente : true;
                initialObs[m.id] = record?.observacao || "";
            });

            setAttendance(initialAttendance);
            setObservations(initialObs);

            return { matriculas: matriculas || [] };
        },
        enabled: !!selectedTurmaId && !!date,
    });

    // 3. Save Mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!studentsData?.matriculas) return;

            const upsertData = studentsData.matriculas.map(m => ({
                matricula_id: m.id,
                data: date,
                presente: attendance[m.id] ?? true,
                observacao: observations[m.id] || null
            }));

            const matriculaIds = studentsData.matriculas.map(m => m.id);

            // Delete existing
            await supabase.from("presencas")
                .delete()
                .in("matricula_id", matriculaIds)
                .eq("data", date);

            // Insert new
            const { error } = await supabase.from("presencas").insert(upsertData);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({
                title: "Chamada salva!",
                description: "A presença dos alunos foi registrada.",
            });
            queryClient.invalidateQueries({ queryKey: ["chamada-students"] });
        },
        onError: (err) => {
            toast({
                title: "Erro ao salvar",
                description: err.message,
                variant: "destructive"
            });
        }
    });

    const togglePresence = (matriculaId: string) => {
        setAttendance(prev => ({
            ...prev,
            [matriculaId]: !prev[matriculaId]
        }));
    };

    const updateObservation = (matriculaId: string, obs: string) => {
        setObservations(prev => ({
            ...prev,
            [matriculaId]: obs
        }));
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Chamada</h1>
                    <p className="text-muted-foreground">
                        Registre a presença dos alunos nas suas turmas
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Selecionar Turma e Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Turma</Label>
                                <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma turma" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loadingTurmas && <SelectItem value="loading" disabled>Carregando...</SelectItem>}
                                        {turmas?.map((t: any) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.nome} - {t.atividades?.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {selectedTurmaId && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Lista de Alunos</CardTitle>
                            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                                {saveMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Salvar Chamada
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loadingStudents ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : studentsData?.matriculas?.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Nenhum aluno matriculado nesta turma.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {studentsData?.matriculas?.map((m: any) => (
                                        <div key={m.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-lg border">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold
                                                        ${attendance[m.id] ? "bg-green-500" : "bg-red-500"}
                                                    `}
                                                >
                                                    {m.alunos?.nome_completo?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{m.alunos?.nome_completo}</p>
                                                    <p className="text-xs text-muted-foreground">Matrícula: {m.id.slice(0, 8)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor={`pres-${m.id}`} className="cursor-pointer">
                                                        {attendance[m.id] ? "Presente" : "Ausente"}
                                                    </Label>
                                                    <Checkbox
                                                        id={`pres-${m.id}`}
                                                        checked={attendance[m.id]}
                                                        onCheckedChange={() => togglePresence(m.id)}
                                                    />
                                                </div>
                                                <Input
                                                    placeholder="Observação"
                                                    className="w-40"
                                                    value={observations[m.id] || ""}
                                                    onChange={(e) => updateObservation(m.id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Chamada;
