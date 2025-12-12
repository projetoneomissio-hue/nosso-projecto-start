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
            if (!selectedTurmaId) return { students: [], existingAttendance: [] };

            // Get Students
            const { data: matriculas, error: matError } = await supabase
                .from("matriculas")
                .select(`
          id,
          aluno_id,
          alunos(id, nome_completo, foto_url)
        `)
                .eq("turma_id", selectedTurmaId)
                .eq("status", "ativa");

            if (matError) throw matError;

            // Get Existing Attendance
            const { data: frequencia, error: freqError } = await supabase
                .from("frequencia")
                .select("*")
                .in("matricula_id", matriculas.map(m => m.id))
                .eq("data", date);

            if (freqError) throw freqError;

            // Initialize state from DB or Default to True (Present)
            const initialAttendance: Record<string, boolean> = {};
            const initialObs: Record<string, string> = {};

            matriculas.forEach(m => {
                const record = frequencia?.find(f => f.matricula_id === m.id);
                // If record exists, use it. If not, default to TRUE (Assuming presence)
                initialAttendance[m.id] = record ? record.presente : true;
                initialObs[m.id] = record?.observacoes || "";
            });

            setAttendance(initialAttendance);
            setObservations(initialObs);

            return { matriculas };
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
                observacoes: observations[m.id] || null
                // On conflict, update "presente" and "observacoes"
            }));

            // Supabase Upsert needs a constraint or index match. 
            // We don't have a unique constraint on (matricula_id, data) yet? 
            // Wait, we should probably check if we can UPSERT by ID if we fetched them, 
            // OR we rely on a unique index. Let's Fetch existing IDs first to be safe or delete/insert?
            // Best practice: Add UNIQUE(matricula_id, data) constraint. 
            // Since I didn't add the constraint in migration, I will delete existing for this day/class and re-insert.
            // It's a bit heavier but safe given current schema state without unique constraint.

            const matriculaIds = studentsData.matriculas.map(m => m.id);

            // Delete existing
            await supabase.from("frequencia")
                .delete()
                .in("matricula_id", matriculaIds)
                .eq("data", date);

            // Insert new
            const { error } = await supabase.from("frequencia").insert(upsertData);
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

    return (
        <DashboardLayout>
            <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Diário de Classe</h1>
                        <p className="text-muted-foreground mt-1">
                            Registre a frequência dos alunos
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => saveMutation.mutate()} disabled={!selectedTurmaId || saveMutation.isPending}>
                            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Chamada
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Dados da Aula</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <Label>Selecione a Turma</Label>
                            <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {turmas?.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.atividades?.nome} - {t.nome} ({t.dias_semana?.join(", ")})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label>Data da Aula</Label>
                            <div className="relative">
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
                        <CardContent className="p-0">
                            {loadingStudents ? (
                                <div className="p-8 flex justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : studentsData?.matriculas?.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    Nenhum aluno ativo nesta turma.
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {studentsData?.matriculas?.map((m) => (
                                        <div key={m.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold
                            ${attendance[m.id] ? "bg-green-500" : "bg-red-500"}
                          `}
                                                >
                                                    {m.alunos?.nome_completo.charAt(0)}
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
                                                        className="h-6 w-6"
                                                    />
                                                </div>
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
