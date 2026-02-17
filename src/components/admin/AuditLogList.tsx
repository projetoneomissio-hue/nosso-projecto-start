import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
    id: string;
    action: "INSERT" | "UPDATE" | "DELETE";
    table_name: string;
    created_at: string;
    old_data: any;
    new_data: any;
    user_id: string;
}

export const AuditLogList = () => {
    const { data: logs, isLoading } = useQuery({
        queryKey: ["audit-logs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("audit_logs" as any)
                .select("*")
                .order("created_at", { ascending: false })
                .limit(50); // Pegar os últimos 50 eventos

            if (error) throw error;
            return data as AuditLog[];
        },
    });

    const getBadgeColor = (action: string) => {
        switch (action) {
            case "INSERT": return "bg-green-500 hover:bg-green-600";
            case "UPDATE": return "bg-blue-500 hover:bg-blue-600";
            case "DELETE": return "bg-red-500 hover:bg-red-600";
            default: return "bg-gray-500";
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                    Logs de Auditoria (Últimas Ações)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data/Hora</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead>Tabela</TableHead>
                                <TableHead>Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Nenhum registro de auditoria encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs?.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-xs">
                                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getBadgeColor(log.action)}>{log.action}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{log.table_name}</TableCell>
                                        <TableCell className="text-xs max-w-[300px] truncate">
                                            {log.action === "DELETE" ? (
                                                <span className="text-muted-foreground">
                                                    ID removido: {log.old_data?.id}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    ID: {log.new_data?.id}
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};
