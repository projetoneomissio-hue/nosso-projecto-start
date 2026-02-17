import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUnidade } from "@/contexts/UnidadeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calendarioService, CriarEventoDTO } from "@/services/calendario.service";
import { ptBR } from "date-fns/locale";
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const CalendarioEscolar = () => {
    const { currentUnidade } = useUnidade();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [novoEvento, setNovoEvento] = useState<Partial<CriarEventoDTO>>({
        titulo: "",
        tipo: "evento",
        eh_dia_letivo: false,
    });

    const canEdit = user?.role === "direcao" || user?.role === "coordenacao";

    // Fetch events for current month (generous range)
    const currentMonthStart = startOfMonth(date || new Date());
    const currentMonthEnd = endOfMonth(date || new Date());

    // Extend range a bit just to be safe for calendar view transition
    const fetchStart = format(new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - 1, 1), 'yyyy-MM-dd');
    const fetchEnd = format(new Date(currentMonthEnd.getFullYear(), currentMonthEnd.getMonth() + 2, 0), 'yyyy-MM-dd');

    const { data: eventos, isLoading } = useQuery({
        queryKey: ['calendario', currentUnidade?.id, fetchStart, fetchEnd],
        queryFn: () => calendarioService.listarEventos(currentUnidade!.id, fetchStart, fetchEnd),
        enabled: !!currentUnidade,
    });

    const criarMutation = useMutation({
        mutationFn: calendarioService.criarEvento,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendario'] });
            setIsDialogOpen(false);
            setNovoEvento({ titulo: "", tipo: "evento", eh_dia_letivo: false });
            toast({ title: "Evento criado com sucesso!" });
        },
        onError: (error) => {
            toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
        }
    });

    const deletarMutation = useMutation({
        mutationFn: calendarioService.excluirEvento,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendario'] });
            toast({ title: "Evento removido" });
        }
    });

    const handleSave = () => {
        if (!currentUnidade || !date || !novoEvento.titulo) return;

        criarMutation.mutate({
            unidade_id: currentUnidade.id,
            titulo: novoEvento.titulo,
            tipo: novoEvento.tipo as any,
            eh_dia_letivo: novoEvento.eh_dia_letivo || false,
            data_inicio: format(date, 'yyyy-MM-dd'),
            data_fim: format(date, 'yyyy-MM-dd'), // MVP: Single day events
            descricao: novoEvento.descricao
        });
    };

    const getDayEvents = (day: Date) => {
        return eventos?.filter(e => isSameDay(new Date(e.data_inicio), day)) || [];
    };

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'feriado': return 'bg-red-100 text-red-800 border-red-200';
            case 'recesso': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'prova': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'reuniao': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (!currentUnidade) return (
        <DashboardLayout>
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Calendário Escolar</h1>
                        <p className="text-muted-foreground">Gerencie o ano letivo de {currentUnidade?.nome}</p>
                    </div>
                    {canEdit && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" /> Novo Evento
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Adicionar ao Calendário</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Data</Label>
                                        <div className="p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Título</Label>
                                        <Input
                                            value={novoEvento.titulo}
                                            onChange={e => setNovoEvento({ ...novoEvento, titulo: e.target.value })}
                                            placeholder="Ex: Feriado Nacional"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tipo</Label>
                                            <Select
                                                value={novoEvento.tipo}
                                                onValueChange={(v: any) => setNovoEvento({ ...novoEvento, tipo: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="evento">Evento</SelectItem>
                                                    <SelectItem value="feriado">Feriado</SelectItem>
                                                    <SelectItem value="recesso">Recesso</SelectItem>
                                                    <SelectItem value="prova">Prova</SelectItem>
                                                    <SelectItem value="reuniao">Reunião</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between mt-8">
                                                <Label className="cursor-pointer" htmlFor="letivo">Dia Letivo?</Label>
                                                <Switch
                                                    id="letivo"
                                                    checked={novoEvento.eh_dia_letivo}
                                                    onCheckedChange={c => setNovoEvento({ ...novoEvento, eh_dia_letivo: c })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button onClick={handleSave} className="w-full" disabled={criarMutation.isPending}>
                                        {criarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-6">
                    <Card className="md:h-[600px]">
                        <CardHeader>
                            <CardTitle>Agenda</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5" />
                                    {date ? format(date, "d 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
                                </h3>

                                {date && getDayEvents(date).length === 0 ? (
                                    <p className="text-muted-foreground py-8 text-center border-2 border-dashed rounded-lg">
                                        Nenhum evento neste dia.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {date && getDayEvents(date).map(evento => (
                                            <div key={evento.id} className={`flex items-center justify-between p-3 rounded-lg border ${getTipoColor(evento.tipo)}`}>
                                                <div>
                                                    <p className="font-medium">{evento.titulo}</p>
                                                    <p className="text-xs opacity-80 uppercase font-semibold tracking-wider">{evento.tipo}</p>
                                                </div>
                                                {canEdit && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:bg-red-200 text-red-700"
                                                        onClick={() => deletarMutation.mutate(evento.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                locale={ptBR}
                                className="rounded-md border shadow w-full flex justify-center"
                                modifiers={{
                                    hasEvent: (d) => getDayEvents(d).length > 0
                                }}
                                modifiersStyles={{
                                    hasEvent: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' }
                                }}
                            />
                            <div className="mt-6 space-y-2">
                                <h4 className="text-sm font-semibold mb-2">Legenda</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div> Feriado</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div> Recesso</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div> Prova</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-100 border border-gray-200"></div> Evento</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CalendarioEscolar;
