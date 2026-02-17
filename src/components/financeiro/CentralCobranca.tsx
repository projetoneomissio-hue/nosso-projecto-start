import { useState } from "react";
import { useInadimplentes } from "@/hooks/useFinanceiro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageCircle, CheckCircle2, Search, Filter } from "lucide-react";
import { generateWhatsAppLink, WhatsAppTemplates } from "@/utils/whatsapp";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const CentralCobranca = () => {
    const { data: inadimplentes, isLoading } = useInadimplentes();
    const [enviados, setEnviados] = useState<Record<string, boolean>>({});
    const [filtroNome, setFiltroNome] = useState("");
    const [filtroMes, setFiltroMes] = useState("todos");

    // Extrair meses únicos para o filtro
    const mesesDisponiveis = Array.from(new Set(inadimplentes?.map(p => {
        return new Date(p.data_vencimento).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    }) || [])).sort();

    const handleEnviar = (pagamento: any) => {
        const nomeResp = pagamento.matricula?.aluno?.responsavel?.nome_completo || "Responsável";
        const nomeAluno = pagamento.matricula?.aluno?.nome_completo || "Aluno";
        const dataVencimento = new Date(pagamento.data_vencimento);
        const mesRef = dataVencimento.toLocaleDateString("pt-BR", { month: 'long' });
        const valor = parseFloat(pagamento.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
        const telefone = pagamento.matricula?.aluno?.responsavel?.telefone;

        if (telefone) {
            const link = generateWhatsAppLink(
                telefone,
                WhatsAppTemplates.cobranca(nomeResp, nomeAluno, mesRef, valor)
            );
            window.open(link, "_blank");

            // Marcar como enviado
            setEnviados(prev => ({ ...prev, [pagamento.id]: true }));
        }
    };

    const filteredData = inadimplentes?.filter(p => {
        const nomeAluno = p.matricula?.aluno?.nome_completo || "";
        const nomeResponsavel = p.matricula?.aluno?.responsavel?.nome_completo || "";

        const matchNome = nomeAluno.toLowerCase().includes(filtroNome.toLowerCase()) ||
            nomeResponsavel.toLowerCase().includes(filtroNome.toLowerCase());

        const mesVencimento = new Date(p.data_vencimento).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        const matchMes = filtroMes === "todos" || mesVencimento === filtroMes;

        return matchNome && matchMes;
    });

    const totalPendente = filteredData?.reduce((acc, curr) => acc + parseFloat(curr.valor), 0) || 0;
    const totalEnviadosSessao = Object.keys(enviados).length;

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendente (Filtro)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">{filteredData?.length} cobranças listadas</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Cobrados Hoje</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {totalEnviadosSessao}
                        </div>
                        <p className="text-xs text-muted-foreground">Mensagens enviadas nesta sessão</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-emerald-500" />
                            Fila de Disparo
                        </CardTitle>

                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar aluno ou responsável..."
                                    className="pl-8"
                                    value={filtroNome}
                                    onChange={(e) => setFiltroNome(e.target.value)}
                                />
                            </div>

                            <Select value={filtroMes} onValueChange={setFiltroMes}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Mês Referência" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos os meses</SelectItem>
                                    {mesesDisponiveis.map(mes => (
                                        <SelectItem key={mes} value={mes}>{mes}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Status</TableHead>
                                    <TableHead>Aluno / Responsável</TableHead>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    <TableHead className="text-right">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Nenhuma pendência encontrada com os filtros atuais.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData?.map((pagamento) => {
                                        const isEnviado = enviados[pagamento.id];
                                        const telefone = pagamento.matricula?.aluno?.responsavel?.telefone;

                                        return (
                                            <TableRow key={pagamento.id} className={isEnviado ? "bg-muted/50" : ""}>
                                                <TableCell>
                                                    {isEnviado ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                    ) : (
                                                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{pagamento.matricula?.aluno?.nome_completo}</span>
                                                        <span className="text-xs text-muted-foreground">{pagamento.matricula?.aluno?.responsavel?.nome_completo}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-destructive">
                                                            {format(new Date(pagamento.data_vencimento), "dd 'de' MMM", { locale: ptBR })}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {/* TODO: Calcular dias de atraso se necessário */}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {telefone ? (
                                                        <span className="text-sm font-mono">{telefone}</span>
                                                    ) : (
                                                        <span className="text-destructive text-xs">Sem telefone</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    R$ {parseFloat(pagamento.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant={isEnviado ? "outline" : "default"}
                                                        className={!isEnviado ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                                                        disabled={!telefone}
                                                        onClick={() => handleEnviar(pagamento)}
                                                    >
                                                        <MessageCircle className="mr-2 h-4 w-4" />
                                                        {isEnviado ? "Reenviar" : "Cobrar"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
