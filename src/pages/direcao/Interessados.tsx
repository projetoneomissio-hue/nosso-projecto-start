import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { solicitacoesService } from "@/services/solicitacoes.service";
import { alunosService } from "@/services/alunos.service";
import { infinitePayService } from "@/services/infinitepay.service";
import { Link, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
    Phone, 
    UserPlus, 
    XCircle, 
    Search, 
    Filter, 
    MoreHorizontal,
    MessageCircle,
    Calendar,
    GraduationCap,
    School,
    HeartPulse,
    Trash2,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { useUnidade } from "@/contexts/UnidadeContext";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Interessados() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { currentUnidade } = useUnidade();
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("todos");
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
    const [checkoutLinkDialog, setCheckoutLinkDialog] = useState<{open: boolean, link: string | null, loading: boolean, leadDetails: any}>({
        open: false,
        link: null,
        loading: false,
        leadDetails: null
    });
    
    // Smart Conversion States
    const [responsavelNome, setResponsavelNome] = useState("");
    const [responsavelEmail, setResponsavelEmail] = useState("");
    const [isExistingResp, setIsExistingResp] = useState(true);
    const [isCheckingResp, setIsCheckingResp] = useState(false);
    const [isentarTaxa, setIsentarTaxa] = useState(false);

    const { data: leads, isLoading } = useQuery({
        queryKey: ["direcao-interessados"],
        queryFn: () => solicitacoesService.fetchAll(),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: any }) => 
            solicitacoesService.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["direcao-interessados"] });
            queryClient.invalidateQueries({ queryKey: ["management-leads-counts"] });
            queryClient.invalidateQueries({ queryKey: ["management-leads-recentes"] });
            toast({ title: "Status atualizado com sucesso!" });
        },
        onError: () => {
            toast({ title: "Erro ao atualizar status", variant: "destructive" });
        }
    });

    // Real conversion logic with financial rules and responsible check
    const convertMutation = useMutation({
        mutationFn: async ({ lead, manualIsento }: { lead: any, manualIsento: boolean }) => {
            if (!currentUnidade?.id) throw new Error("Unidade não selecionada.");

            const { data: { session } } = await supabase.auth.getSession();
            const adminId = session?.user?.id;

            // 1. Verificar se o Responsável já existe (por CPF ou Email)
            const cleanCpfResp = lead.cpf_responsavel ? lead.cpf_responsavel.replace(/\D/g, "") : null;
            let finalRespId = null;
            let needsInvitation = false;

            const { data: existingProfile } = await supabase
                .from("profiles")
                .select("id")
                .or(`email.eq.${lead.email_responsavel || lead.whatsapp},cpf.eq.${cleanCpfResp}`)
                .maybeSingle();

            if (existingProfile) {
                finalRespId = existingProfile.id;
            } else {
                if (!responsavelNome || !responsavelEmail) {
                    throw new Error("Responsável não encontrado. Preencha o Nome e E-mail para prosseguir.");
                }
                needsInvitation = true;
                // Temporarily use the Admin's ID to satisfy the Foreign Key constraint for creating the Aluno.
                // It will be re-assigned when the Responsible redeems the invitation.
                finalRespId = adminId;
            }

            // 2. Verificar se o Aluno já existe
            const { aluno: existingAluno } = await alunosService.checkGlobalDuplicate({
                nome: lead.nome_completo,
                dataNascimento: lead.data_nascimento
            });

            let alunoId = existingAluno?.id;

            // 3. Se não existe, cria o Aluno
            if (!alunoId) {
                const nomeFinal = lead.sobrenome 
                    ? `${lead.nome_completo} ${lead.sobrenome}`.trim() 
                    : lead.nome_completo;

                const { data: newAluno, error: alunoError } = await supabase.from("alunos").insert({
                    nome_completo: nomeFinal,
                    data_nascimento: lead.data_nascimento,
                    responsavel_id: finalRespId,
                    unidade_id: currentUnidade.id,
                    observacoes: lead.necessidades_especiais ? `Saúde/Neuro: ${lead.necessidades_especiais}` : ""
                } as any).select().single();

                if (alunoError) throw new Error("Erro ao criar aluno: " + alunoError.message);
                alunoId = newAluno.id;
            }

            // 4. Se precisava de convite, gerar AGORA e disparar o e-mail
            if (needsInvitation) {
                const inviteToken = crypto.randomUUID();
                await supabase.from("invitations").insert({
                    email: responsavelEmail,
                    role: "responsavel",
                    status: "pending",
                    token: inviteToken,
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                } as any);

                // Disparar o envio real do e-mail
                await supabase.functions.invoke('send-invitation-email', {
                  body: {
                    to: responsavelEmail,
                    inviteToken: inviteToken,
                    role: "responsavel",
                    origin: window.location.origin,
                    nomeResponsavel: responsavelNome
                  },
                });
            }

            // 4. Regra de Taxa de Matrícula: Verificar histórico (a menos que já esteja isento manualmente)
            let isFirstTime = false;
            
            if (!manualIsento) {
                const { data: matriculasAnteriores } = await supabase
                    .from("matriculas")
                    .select("id")
                    .eq("aluno_id", alunoId);

                isFirstTime = !matriculasAnteriores || matriculasAnteriores.length === 0;
            }

            // 5. Tentar encontrar a Atividade e uma Turma compatível
            let targetTurmaId = null;
            if (lead.atividade_desejada) {
                const buscaAmpla = lead.atividade_desejada.replace(/-/g, " ");
                const { data: atividade } = await supabase
                    .from("atividades")
                    .select("id")
                    .ilike("nome", `%${buscaAmpla}%`)
                    .eq("ativa", true)
                    .maybeSingle();

                if (atividade) {
                    const { data: turma } = await supabase
                        .from("turmas")
                        .select("id")
                        .eq("atividade_id", atividade.id)
                        .eq("ativa", true)
                        .limit(1)
                        .maybeSingle();
                    
                    if (turma) targetTurmaId = turma.id;
                }
            }

            // Fallback: Se não achou turma compatível, pega a primeira turma ativa para garantir a geração da matrícula/pagamento.
            if (!targetTurmaId) {
                 const { data: fallbackTurma } = await supabase
                        .from("turmas")
                        .select("id")
                        .eq("ativa", true)
                        .limit(1)
                        .maybeSingle();
                 if (fallbackTurma) targetTurmaId = fallbackTurma.id;
            }

            // 6. Criar Matrícula Pendente (se encontramos a turma)
            let matriculaId = null;
            if (targetTurmaId) {
                const { data: newMatricula, error: matError } = await supabase.from("matriculas").insert({
                    aluno_id: alunoId,
                    turma_id: targetTurmaId,
                    status: "pendente",
                    data_inicio: new Date().toISOString().split("T")[0]
                }).select().single();
                
                if (!matError) matriculaId = newMatricula.id;
            }

            // 7. Se for 1ª vez e tiver matrícula, gerar Taxa
            let pagamentoId = null;
            if (isFirstTime && matriculaId) {
                const { data: pagamentoData, error: pagError } = await supabase.from("pagamentos").insert({
                    matricula_id: matriculaId,
                    valor: 25.00, // Sugestão baseada no MatriculasPendentes.tsx
                    data_vencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                    status: "pendente",
                    referencia: "TAXA-MATRICULA",
                    unidade_id: currentUnidade.id
                }).select().single();
                
                if (!pagError) pagamentoId = pagamentoData.id;
            }

            // 8. Finalizar Solicitação
            await solicitacoesService.updateStatus(lead.id, "aprovada");
            
            return { alunoId, isFirstTime, matriculaCriada: !!matriculaId, pagamentoId, lead };

        },
        onSuccess: async (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["direcao-interessados"] });
            queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
            queryClient.invalidateQueries({ queryKey: ["alunos"] });
            setIsConvertDialogOpen(false);
            
            // Se gerou um pagamentoId, vamos tentar criar o link
            if (data.pagamentoId) {
                setCheckoutLinkDialog({ open: true, link: null, loading: true, leadDetails: data.lead });
                try {
                    const result = await infinitePayService.createCheckoutLink(data.pagamentoId);
                    setCheckoutLinkDialog({ open: true, link: result.gateway_url, loading: false, leadDetails: data.lead });
                } catch (e: any) {
                    toast({ title: "Lead convertido, mas erro no Pix", description: e.message, variant: "destructive" });
                    setCheckoutLinkDialog({ open: false, link: null, loading: false, leadDetails: null });
                }
            } else {
                if (data.isFirstTime === false) {
                     toast({ 
                        title: "✅ Conversão Concluída (Isento)", 
                        description: "O aluno já possuía uma matrícula em nosso sistema (provavelmente em outra atividade). A taxa de matrícula de R$25 não será cobrada novamente, pois é vitalícia. Nenhuma fatura foi gerada.",
                        duration: 8000
                    });
                } else {
                     toast({ 
                        title: "Lead convertido!", 
                        description: "Aluno convertido, mas não foi possível gerar a fatura. Você pode emiti-la futuramente na tela de Matrículas." 
                    });
                }
            }
        },
        onError: (error: any) => {
            toast({ title: "Erro na conversão", description: error.message, variant: "destructive" });
        }
    });

    const filteredLeads = leads?.filter(lead => {
        const matchesSearch = lead.nome_completo.toLowerCase().includes(search.toLowerCase()) || 
                             lead.sobrenome?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === "todos" || lead.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleWhatsApp = (lead: any) => {
        const cleanPhone = lead.whatsapp.replace(/\D/g, "");
        const message = `Olá ${lead.nome_completo}! Recebemos seu interesse em nosso projeto (${lead.atividade_desejada || "Geral"}). Podemos conversar?`;
        window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "interessado": return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none font-black text-[10px]">PASSO 1</Badge>;
            case "pendente": return <Badge variant="secondary" className="bg-[#FFC200]/10 text-[#FFC200] border-none font-black text-[10px]">FICHA COMPLETA</Badge>;
            case "aprovada": return <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-none font-black text-[10px]">CONVERTIDO</Badge>;
            case "rejeitada": return <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-none font-black text-[10px]">REJEITADO</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-background p-6 lg:p-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase italic">
                            Gestão de <span className="text-[#E8004F]">Interessados</span>
                        </h1>
                        <p className="text-muted-foreground/60 text-sm font-medium uppercase tracking-[0.2em] mt-1">
                            Acompanhamento de Leads e Solicitações de Matrícula
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por nome..." 
                            className="pl-10 bg-card border-none shadow-sm h-11 font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant={filterStatus === "todos" ? "default" : "outline"}
                            className={`flex-1 h-11 font-black uppercase text-[10px] ${filterStatus === "todos" ? "bg-[#E8004F]" : ""}`}
                            onClick={() => setFilterStatus("todos")}
                        >
                            Todos
                        </Button>
                        <Button 
                            variant={filterStatus === "interessado" ? "default" : "outline"}
                            className={`flex-1 h-11 font-black uppercase text-[10px] ${filterStatus === "interessado" ? "bg-blue-500" : ""}`}
                            onClick={() => setFilterStatus("interessado")}
                        >
                            Leads
                        </Button>
                        <Button 
                            variant={filterStatus === "pendente" ? "default" : "outline"}
                            className={`flex-1 h-11 font-black uppercase text-[10px] ${filterStatus === "pendente" ? "bg-[#FFC200] text-black" : ""}`}
                            onClick={() => setFilterStatus("pendente")}
                        >
                            Fichas
                        </Button>
                    </div>
                </div>

                {/* Leads Table */}
                <GlassCard title="" className="p-0 overflow-hidden border-border/40">
                    <Table>
                        <TableHeader className="bg-foreground/[0.02]">
                            <TableRow className="hover:bg-transparent border-border/40">
                                <TableHead className="w-[300px] font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 py-4 pl-6">Aluno / Inscrição</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60">Atividade</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60">Status</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 text-right pr-6">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={4} className="p-4">
                                            <div className="h-12 w-full bg-foreground/5 animate-pulse rounded-lg" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredLeads && filteredLeads.length > 0 ? (
                                filteredLeads.map((lead) => (
                                    <TableRow key={lead.id} className="group hover:bg-foreground/[0.02] border-border/20 transition-all duration-300">
                                        {/* Aluno Info */}
                                        <TableCell className="py-4 pl-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 rounded-xl border border-border/40 shadow-sm transition-transform group-hover:scale-110 duration-500">
                                                    <AvatarFallback className="bg-primary/5 text-primary font-black text-sm uppercase">
                                                        {lead.nome_completo[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <p className="font-black text-foreground text-sm uppercase leading-none mb-1">
                                                        {lead.nome_completo} <span className="text-muted-foreground/40 ml-1 font-bold">{lead.sobrenome}</span>
                                                    </p>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                                        {format(new Date(lead.created_at), "dd 'de' MMMM", { locale: ptBR })}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Atividade & Detalhes */}
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tight py-0 px-2 h-5 border-border/40">
                                                        {lead.atividade_desejada || "Geral"}
                                                    </Badge>
                                                    {lead.necessidades_especiais && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <HeartPulse className="h-3.5 w-3.5 text-amber-500/80" />
                                                                </TooltipTrigger>
                                                                <TooltipContent side="right" className="bg-amber-50 border-amber-200 text-amber-700 text-[10px] font-bold uppercase p-2">
                                                                    {lead.necessidades_especiais}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase italic flex items-center gap-1">
                                                    <Calendar className="h-2.5 w-2.5" /> 
                                                    {format(new Date(lead.data_nascimento), "dd/MM/yyyy")}
                                                </p>
                                            </div>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                {getStatusBadge(lead.status)}
                                                {lead.escola && (
                                                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase truncate max-w-[150px]">
                                                        {lead.escola}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Ações */}
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button 
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-9 w-9 bg-[#25D366]/5 border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all duration-300"
                                                                onClick={() => handleWhatsApp(lead)}
                                                            >
                                                                <Phone className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>WhatsApp</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="icon" className="h-9 w-9 border-border/40 hover:bg-foreground/[0.05] transition-all">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl">
                                                        {lead.status !== "aprovada" && (
                                                            <DropdownMenuItem 
                                                                className="gap-2 font-bold text-xs uppercase p-2 rounded-lg text-green-600 focus:text-green-600 focus:bg-green-50"
                                                                onClick={async () => {
                                                                    setSelectedLead(lead);
                                                                    setIsConvertDialogOpen(true);
                                                                    
                                                                    // Check if responsible exists
                                                                    setIsCheckingResp(true);
                                                                    const cleanCpf = lead.cpf_responsavel?.replace(/\D/g, "");
                                                                    const { data: profile } = await supabase
                                                                        .from("profiles")
                                                                        .select("id, nome_completo, email")
                                                                        .or(`email.eq.${lead.email_responsavel || ""},cpf.eq.${cleanCpf || "NONE"}`)
                                                                        .maybeSingle();
                                                                    
                                                                    if (profile) {
                                                                        setIsExistingResp(true);
                                                                    } else {
                                                                        setIsExistingResp(false);
                                                                        setResponsavelNome(lead.nome_responsavel || "");
                                                                        setResponsavelEmail(lead.email_responsavel || "");
                                                                    }
                                                                    setIsCheckingResp(false);
                                                                }}
                                                            >
                                                                <UserPlus className="h-4 w-4" /> Converter Aluno
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem 
                                                            className="gap-2 font-bold text-xs uppercase p-2 rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            onClick={async () => {
                                                                if (confirm("Deseja realmente rejeitar esta solicitação?")) {
                                                                    await solicitacoesService.updateStatus(lead.id, "rejeitada");
                                                                    queryClient.invalidateQueries({ queryKey: ["direcao-interessados"] });
                                                                    toast({ title: "Solicitação rejeitada" });
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Rejeitar Lead
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Search className="h-10 w-10" />
                                            <p className="font-black uppercase tracking-widest text-[10px]">Nenhum registro encontrado</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </GlassCard>
            </div>

            {/* Convert Dialog */}
            <Dialog open={isConvertDialogOpen} onOpenChange={(open) => {
                setIsConvertDialogOpen(open);
                if (!open) {
                    setResponsavelNome("");
                    setResponsavelEmail("");
                    setIsExistingResp(true);
                    setIsentarTaxa(false);
                }
            }}>
                <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl overflow-hidden p-0">
                    <div className="h-1.5 w-full bg-green-500" />
                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase italic italic flex items-center gap-3">
                                <GraduationCap className="h-6 w-6 text-green-500" />
                                Converter <span className="text-green-500">em Aluno</span>
                            </DialogTitle>
                            <DialogDescription className="font-medium text-base mt-2">
                                Você está prestes a converter <strong>{selectedLead?.nome_completo}</strong> em um aluno registrado no sistema.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="my-6 p-4 rounded-xl bg-foreground/[0.03] border border-border/50 space-y-3">
                            <div className="flex justify-between text-[11px] font-black uppercase opacity-60">
                                <span>Aluno</span>
                                <span className="text-foreground">{selectedLead?.nome_completo} {selectedLead?.sobrenome}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-black uppercase opacity-60">
                                <span>Atividade</span>
                                <Badge variant="secondary" className="bg-primary/10 text-primary h-4 text-[8px] font-black">{selectedLead?.atividade_desejada || "Geral"}</Badge>
                            </div>
                        </div>

                        {!isExistingResp && (
                            <div className="mb-6 p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-4 animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase italic">
                                    <UserPlus className="h-4 w-4" />
                                    Novo Responsável Detectado
                                </div>
                                {isCheckingResp ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase opacity-50 px-1">Nome Completo do Pai/Mãe</label>
                                            <Input 
                                                placeholder="Nome Completo" 
                                                value={responsavelNome}
                                                onChange={(e) => setResponsavelNome(e.target.value)}
                                                className="h-10 border-none bg-background/50 font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase opacity-50 px-1">E-mail para Convite</label>
                                            <Input 
                                                placeholder="email@exemplo.com" 
                                                value={responsavelEmail}
                                                onChange={(e) => setResponsavelEmail(e.target.value)}
                                                className="h-10 border-none bg-background/50 font-medium"
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic px-1">
                                            * Criaremos um convite automático para que o responsável acesse o sistema.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <label className="flex items-start gap-3 mt-4 text-sm font-semibold text-muted-foreground bg-secondary/30 p-4 rounded-xl border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors">
                            <input 
                                type="checkbox" 
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                                checked={isentarTaxa}
                                onChange={(e) => setIsentarTaxa(e.target.checked)}
                            />
                            <div>
                                <span className="text-foreground block mb-0.5">Isentar Taxa de Matrícula</span>
                                <span className="font-normal opacity-70 text-[11px] leading-tight block">
                                    Marque se o aluno já for matriculado em outro projeto ou se possuir bolsa integral.
                                </span>
                            </div>
                        </label>

                        <DialogFooter className="flex gap-2 mt-6">
                            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)} className="flex-1 font-black uppercase italic h-12 rounded-xl">
                                Cancelar
                            </Button>
                            <Button 
                                className="flex-1 bg-green-600 hover:bg-green-700 font-black uppercase italic h-12 rounded-xl"
                                onClick={() => {
                                    if (!isExistingResp && (!responsavelNome || !responsavelEmail)) {
                                        toast({
                                            variant: "destructive",
                                            title: "Atenção",
                                            description: "Preencha o nome e e-mail do responsável."
                                        });
                                        return;
                                    }
                                    convertMutation.mutate({ lead: selectedLead, manualIsento: isentarTaxa });
                                }}
                                disabled={convertMutation.isPending || isCheckingResp}
                            >
                                {convertMutation.isPending ? "Processando..." : "Confirmar Conversão"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Checkout Link / Resumo Pagamento Dialog */}
            <Dialog 
                open={checkoutLinkDialog.open} 
                onOpenChange={(open) => !open && setCheckoutLinkDialog(prev => ({ ...prev, open: false }))}
            >
                <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                    <div className="h-2 w-full bg-[#E8004F]" />
                    <div className="p-6 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-green-100/50 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        
                        <div>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
                                Matrícula Aceita!
                            </DialogTitle>
                            <DialogDescription className="text-sm font-medium mt-2">
                                O aluno foi registrado com sucesso. A taxa de matrícula no valor de <strong>R$ 25,00</strong> foi gerada.
                            </DialogDescription>
                        </div>

                        <div className="p-4 bg-muted/30 rounded-2xl border border-primary/10">
                            {checkoutLinkDialog.loading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-8 w-full rounded-xl" />
                                    <p className="text-xs uppercase font-bold text-muted-foreground animate-pulse">Gerando Link de Pagamento Segura...</p>
                                </div>
                            ) : checkoutLinkDialog.link ? (
                                <div className="space-y-4">
                                    <div className="flex bg-background border rounded-lg p-2 items-center gap-2">
                                        <Link className="h-4 w-4 text-muted-foreground ml-2" />
                                        <input 
                                            readOnly 
                                            value={checkoutLinkDialog.link} 
                                            className="bg-transparent border-none flex-1 text-xs outline-none truncate font-mono text-muted-foreground" 
                                        />
                                        <Button 
                                            size="icon" 
                                            variant="secondary" 
                                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                            onClick={() => {
                                                navigator.clipboard.writeText(checkoutLinkDialog.link || "");
                                                toast({ title: "Link Copiado!" });
                                            }}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button 
                                        className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-black uppercase text-xs h-12 rounded-xl shadow-xl shadow-[#25D366]/20 gap-2"
                                        onClick={() => {
                                            const lead = checkoutLinkDialog.leadDetails;
                                            const cleanPhone = lead?.whatsapp?.replace(/\D/g, "");
                                            if (!cleanPhone) return;
                                            const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                                            const msg = encodeURIComponent(`Olá ${lead.nome_responsavel || lead.nome_completo}! Parabéns, a matrícula de ${lead.nome_completo} foi aprovada no Neo Missio 🎉\n\nPara concluir o ingresso na modalidade de ${lead.atividade_desejada || 'Geral'}, você precisa realizar o pagamento da *Taxa de Matrícula (R$ 25,00)*.\n\nAcesse o link seguro a seguir para pagar via Pix ou Cartão:\n${checkoutLinkDialog.link}\n\nApós o pagamento o acesso ao sistema será liberado automaticamente!`);
                                            window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
                                            setCheckoutLinkDialog(prev => ({ ...prev, open: false }));
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                        Enviar Cobrança via WhatsApp
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm font-bold text-destructive">Não foi possível gerar o link de pagamento. Acesse o menu Financeiro.</p>
                            )}
                        </div>
                        
                        <Button variant="ghost" className="w-full uppercase text-[10px] font-bold" onClick={() => setCheckoutLinkDialog(prev => ({ ...prev, open: false }))}>
                            Fechar e Continuar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
