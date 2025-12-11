
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Megaphone, Bell, Users, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Comunicados = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [tipo, setTipo] = useState<"geral" | "turma" | "aluno">("geral");
    const [destinatarioId, setDestinatarioId] = useState<string>("");
    const [titulo, setTitulo] = useState("");
    const [conteudo, setConteudo] = useState("");
    const [urgente, setUrgente] = useState(false);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch Comunicados
    const { data: comunicados, isLoading } = useQuery({
        queryKey: ["comunicados-direcao"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("comunicados")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    // Fetch Auxiliar Data for Selection and Display
    const { data: turmas } = useQuery({
        queryKey: ["turmas-list"],
        queryFn: async () => {
            const { data } = await supabase.from("turmas").select("id, nome").eq("ativa", true);
            return data || [];
        },
    });

    const { data: alunos } = useQuery({
        queryKey: ["alunos-list"],
        queryFn: async () => {
            const { data } = await supabase.from("alunos").select("id, nome_completo").eq("ativo", true);
            return data || [];
        },
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.from("comunicados").insert({
                titulo,
                conteudo,
                tipo,
                destinatario_id: tipo === "geral" ? null : destinatarioId,
                urgente,
                criado_por: (await supabase.auth.getUser()).data.user?.id,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comunicados-direcao"] });
            setIsOpen(false);
            resetForm();
            toast({ title: "Sucesso", description: "Comunicado enviado!" });
        },
        onError: (error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        },
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("comunicados").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comunicados-direcao"] });
            toast({ title: "Removido", description: "Comunicado apagado." });
        },
    });

    const resetForm = () => {
        setTitulo("");
        setConteudo("");
        setTipo("geral");
        setDestinatarioId("");
        setUrgente(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tipo !== "geral" && !destinatarioId) {
            toast({ title: "Atenção", description: "Selecione o destinatário.", variant: "alert" });
            return;
        }
        createMutation.mutate();
    };

    const getTargetName = (item: any) => {
        if (item.tipo === "geral") return "Todos";
        if (item.tipo === "turma") return turmas?.find(t => t.id === item.destinatario_id)?.nome || "Turma removida";
        if (item.tipo === "aluno") return alunos?.find(a => a.id === item.destinatario_id)?.nome_completo || "Aluno removido";
        return "-";
    };

    const getTypeIcon = (t: string) => {
        if (t === 'geral') return <Megaphone className="h-4 w-4 text-blue-500" />;
        if (t === 'turma') return <Users className="h-4 w-4 text-green-500" />;
        return <User className="h-4 w-4 text-orange-500" />;
    };

    return (
        <DashboardLayout>
            <div className="p-6 lg:p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Comunicados</h1>
                        <p className="text-muted-foreground mt-1">Gerencie os avisos enviados para pais e alunos</p>
                    </div>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Novo Comunicado</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Enviar Novo Comunicado</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Título</Label>
                                    <Input
                                        value={titulo}
                                        onChange={(e) => setTitulo(e.target.value)}
                                        placeholder="Ex: Reunião de Pais"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Conteúdo</Label>
                                    <Textarea
                                        value={conteudo}
                                        onChange={(e) => setConteudo(e.target.value)}
                                        placeholder="Digite a mensagem..."
                                        rows={4}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Destino</Label>
                                        <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="geral">Geral (Todos)</SelectItem>
                                                <SelectItem value="turma">Por Turma</SelectItem>
                                                <SelectItem value="aluno">Por Aluno (Individual)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {tipo !== "geral" && (
                                        <div className="space-y-2">
                                            <Label>{tipo === "turma" ? "Selecione a Turma" : "Selecione o Aluno"}</Label>
                                            <Select value={destinatarioId} onValueChange={setDestinatarioId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px]">
                                                    {tipo === "turma"
                                                        ? turmas?.map((t: any) => (
                                                            <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                                                        ))
                                                        : alunos?.map((a: any) => (
                                                            <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch id="urgente" checked={urgente} onCheckedChange={setUrgente} />
                                    <Label htmlFor="urgente" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                        Marcar como Urgente <Bell className="h-3 w-3 text-red-500" />
                                    </Label>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Enviar
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Destinatário</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : comunicados?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        Nenhum comunicado enviado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                comunicados?.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-2">
                                                    {item.urgente && <Bell className="h-3 w-3 text-red-500 fill-red-500" />}
                                                    {item.titulo}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[300px]">{item.conteudo}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 capitalize border px-2 py-1 rounded-full w-fit text-xs bg-muted">
                                                {getTypeIcon(item.tipo)}
                                                {item.tipo}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getTargetName(item)}</TableCell>
                                        <TableCell>
                                            {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Comunicados;
