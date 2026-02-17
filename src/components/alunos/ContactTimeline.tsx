import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Phone,
    MessageCircle,
    Mail,
    Users,
    Banknote,
    MoreHorizontal,
    Trash2,
    CalendarClock,
    Send,
    Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

interface ContactTimelineProps {
    alunoId: string;
}

type TipoContato = "ligacao" | "whatsapp" | "email" | "reuniao" | "cobranca" | "outro";

const getIcon = (tipo: TipoContato) => {
    switch (tipo) {
        case "ligacao":
            return <Phone className="h-4 w-4" />;
        case "whatsapp":
            return <MessageCircle className="h-4 w-4" />;
        case "email":
            return <Mail className="h-4 w-4" />;
        case "reuniao":
            return <Users className="h-4 w-4" />;
        case "cobranca":
            return <Banknote className="h-4 w-4" />;
        default:
            return <MoreHorizontal className="h-4 w-4" />;
    }
};

const getLabel = (tipo: TipoContato) => {
    switch (tipo) {
        case "ligacao":
            return "Ligação";
        case "whatsapp":
            return "WhatsApp";
        case "email":
            return "E-mail";
        case "reuniao":
            return "Reunião";
        case "cobranca":
            return "Cobrança";
        default:
            return "Outro";
    }
};

import { contactsService, ContactType } from "@/services/contacts.service";

export const ContactTimeline = ({ alunoId }: { alunoId: string }) => {
    const [tipo, setTipo] = useState<ContactType>("outro");
    const [descricao, setDescricao] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Buscar logs
    const { data: logs, isLoading } = useQuery({
        queryKey: ["contact-logs", alunoId],
        queryFn: () => contactsService.listByAluno(alunoId),
    });

    // Criar log mutation
    const addMutation = useMutation({
        mutationFn: (params: { tipo: ContactType; descricao: string }) =>
            contactsService.create({ aluno_id: alunoId, ...params }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contact-logs", alunoId] });
            setDescricao("");
            setTipo("outro");
            toast({ title: "Contato registrado com sucesso!" });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao registrar contato",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Deletar log mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => contactsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contact-logs", alunoId] });
            toast({ title: "Registro excluído" });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao excluir",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!descricao.trim()) return;
        addMutation.mutate({ tipo, descricao });
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Formulário de Novo Registro */}
            <Card className="border-l-4 border-l-primary/50">
                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            <Select
                                value={tipo}
                                onValueChange={(val) => setTipo(val as ContactType)}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ligacao">Ligação</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    <SelectItem value="email">E-mail</SelectItem>
                                    <SelectItem value="reuniao">Reunião</SelectItem>
                                    <SelectItem value="cobranca">Cobrança</SelectItem>
                                    <SelectItem value="outro">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Resumo do contato..."
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={addMutation.isPending || !descricao.trim()}
                                className="gap-2"
                            >
                                {addMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Send className="h-3 w-3" />
                                )}
                                Registrar
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Linha do Tempo */}
            <div className="flex-1 min-h-[300px] relative">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Histórico de Contatos
                </h3>

                <ScrollArea className="h-[400px] pr-4">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : logs?.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                            Nenhum contato registrado ainda.
                        </div>
                    ) : (
                        <div className="space-y-4 pl-2">
                            {logs?.map((log) => (
                                <div key={log.id} className="relative pl-6 pb-4 border-l-2 border-border last:border-0 last:pb-0">
                                    {/* Bolinha na linha do tempo */}
                                    <div className="absolute -left-[9px] top-0 bg-background p-1 rounded-full border">
                                        {getIcon(log.tipo)}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm">
                                                    {getLabel(log.tipo)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(log.data_contato), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                </span>
                                            </div>
                                            {(user?.id === log.user_id || user?.role === 'direcao') && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                    onClick={() => deleteMutation.mutate(log.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>

                                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                                            {log.descricao}
                                        </p>

                                        <div className="flex items-center gap-2 mt-1">
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={log.author?.avatar_url} />
                                                <AvatarFallback className="text-[10px]">
                                                    {log.author?.nome_completo?.substring(0, 2).toUpperCase() || "??"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs text-muted-foreground">
                                                {log.author?.nome_completo || "Usuário Desconhecido"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
}
