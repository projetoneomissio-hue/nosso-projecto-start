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
import { Loader2, Save, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ObservacaoAluno } from "@/components/professor/ObservacaoAluno";

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
                    alunos(
                      id, 
                      nome_completo,
                      anamneses(is_pne, pne_descricao, doenca_cronica, alergias)
                    )
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

            try {
                // Delete existing
                await supabase.from("presencas")
                    .delete()
                    .in("matricula_id", matriculaIds)
                    .eq("data", date);

                // Insert new
                const { error } = await supabase.from("presencas").insert(upsertData);
                if (error) throw error;
            } catch (error) {
                // FALLBACK OFFLINE
                console.warn("Erro ao salvar online. Salvando offline...", error);

                const offlineQueue = JSON.parse(localStorage.getItem("offline_chamadas") || "[]");
                offlineQueue.push({
                    date,
                    turmaId: selectedTurmaId,
                    data: upsertData,
                    timestamp: Date.now()
                });
                localStorage.setItem("offline_chamadas", JSON.stringify(offlineQueue));

                // Throw error to trigger onError context, but specialized message
                throw new Error("Sem conexão. Dados salvos no dispositivo.");
            }
        },
        onSuccess: () => {
            toast({
                title: "Chamada salva!",
                description: "A presença dos alunos foi registrada.",
            });
            queryClient.invalidateQueries({ queryKey: ["chamada-students"] });
        },
        onError: (err) => {
            if (err.message.includes("Sem conexão")) {
                toast({
                    title: "Salvo Offline",
                    description: "Sem internet. Sincronizaremos quando retomar a conexão.",
                    variant: "default", // Or warning
                    className: "bg-yellow-500 text-white"
                });
            } else {
                toast({
                    title: "Erro ao salvar",
                    description: err.message,
                    variant: "destructive"
                });
            }
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
            <div className="space-y-4 pb-20"> {/* pb-20 for bottom action bar */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Chamada</h1>
                    <p className="text-muted-foreground text-sm">
                        Registre a presença dos alunos
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Selecione a Data</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={new Date(date + "T12:00:00")}
                                onSelect={(d) => d && setDate(d.toISOString().split("T")[0])}
                                className="rounded-md border"
                                locale={ptBR}
                            />
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle>Chamada</CardTitle>
                                    {selectedTurmaId && (
                                        <p className="text-sm text-muted-foreground">
                                            {Object.values(attendance).filter(Boolean).length} presentes de {studentsData?.matriculas?.length || 0} alunos
                                        </p>
                                    )}
                                </div>

                                {selectedTurmaId && (studentsData?.matriculas?.length || 0) > 0 && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const newState = { ...attendance };
                                                studentsData?.matriculas?.forEach((m: any) => newState[m.id] = true);
                                                setAttendance(newState);
                                            }}
                                        >
                                            Todos Presentes
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const newState = { ...attendance };
                                                studentsData?.matriculas?.forEach((m: any) => newState[m.id] = false);
                                                setAttendance(newState);
                                            }}
                                        >
                                            Todos Ausentes
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Turma</Label>
                                <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
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

                            {/* Mobile Date Input (visible only on small screens if needed, or stick to Calendar) */}
                            <div className="lg:hidden">
                                <Label>Data</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>

                            {selectedTurmaId && (
                                <div className="space-y-3">
                                    {loadingStudents ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : studentsData?.matriculas?.length === 0 ? (
                                        <Card className="p-8 text-center text-muted-foreground">
                                            Nenhum aluno nesta turma.
                                        </Card>
                                    ) : (
                                        studentsData?.matriculas?.map((m: any) => (
                                            <Card
                                                key={m.id}
                                                className={`transition-all duration-200 cursor-pointer active:scale-[0.99] border-l-4 ${attendance[m.id]
                                                    ? "border-l-green-500 bg-green-50/30 hover:bg-green-50/50"
                                                    : "border-l-red-500 bg-red-50/30 hover:bg-red-50/50"
                                                    }`}
                                                onClick={() => togglePresence(m.id)}
                                            >
                                                <CardContent className="p-4 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                        <div
                                                            className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm transition-colors
                                                                ${attendance[m.id] ? "bg-green-500" : "bg-red-500"}
                                                            `}
                                                        >
                                                            {m.alunos?.nome_completo?.charAt(0) || "?"}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold truncate text-foreground text-base">
                                                                    {m.alunos?.nome_completo}
                                                                </p>
                                                                {m.alunos?.anamneses?.[0]?.is_pne && (
                                                                    <div
                                                                        className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse"
                                                                        title={`PNE: ${m.alunos?.anamneses?.[0]?.pne_descricao || "Ver ficha"}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toast({
                                                                                title: "Alerta PNE",
                                                                                description: m.alunos?.anamneses?.[0]?.pne_descricao || "Este aluno possui necessidades especiais.",
                                                                                variant: "destructive"
                                                                            });
                                                                        }}
                                                                    >
                                                                        <AlertCircle className="h-3 w-3 text-white" />
                                                                    </div>
                                                                )}
                                                                {(m.alunos?.anamneses?.[0]?.doenca_cronica || m.alunos?.anamneses?.[0]?.alergias) && (
                                                                    <div
                                                                        className="h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center"
                                                                        title="Saúde / Alergia"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toast({
                                                                                title: "Alergia/Saúde",
                                                                                description: `${m.alunos?.anamneses?.[0]?.alergias ? "Alergias: " + m.alunos?.anamneses?.[0]?.alergias : ""} ${m.alunos?.anamneses?.[0]?.doenca_cronica ? "\nDoença: " + m.alunos?.anamneses?.[0]?.doenca_cronica : ""}`,
                                                                            });
                                                                        }}
                                                                    >
                                                                        <AlertCircle className="h-3 w-3 text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div
                                                                className="flex gap-2 mt-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <ObservacaoAluno
                                                                    alunoId={m.aluno_id}
                                                                    alunoNome={m.alunos?.nome_completo}
                                                                    turmaId={selectedTurmaId}
                                                                    onSave={(text, photoUrl) => {
                                                                        setObservations((prev) => ({
                                                                            ...prev,
                                                                            [m.aluno_id]: text,
                                                                        }));
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0">
                                                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${attendance[m.id]
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                            }`}>
                                                            {attendance[m.id] ? "Presente" : "Ausente"}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>


                {/* Floating Action Bar for Mobile */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex items-center justify-between gap-4 z-50 md:pl-64">
                    <div className="text-sm text-muted-foreground hidden sm:block">
                        {studentsData?.matriculas?.length || 0} alunos listados
                    </div>
                    <Button
                        size="lg"
                        className="w-full sm:w-auto shadow-lg"
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending || !selectedTurmaId}
                    >
                        {saveMutation.isPending ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-5 w-5" />
                        )}
                        Salvar Chamada
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Chamada;
