import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useQuery } from "@tanstack/react-query";
import {
    Users,
    TrendingUp,
    Activity,
    Calendar,
    ArrowUpRight,
    GraduationCap,
    ClipboardList,
    Filter
} from "lucide-react";
import { matriculasService } from "@/services/matriculas.service";
import { turmasService } from "@/services/turmas.service";
import { alunosService } from "@/services/alunos.service";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DashboardCoordenacao = () => {
    // Design system tokens
    const colors = {
        atividade: "#E8004F",
        conversa: "#FFC200",
        escuta: "#4DD9C0",
        conhecimento: "#6B5CE7",
        quietude: "#001F7A",
    };

    // Data Fetching
    const { data: todosAlunos, isLoading: loadingTodosAlunos } = useQuery({
        queryKey: ["coordenacao-todos-alunos"],
        queryFn: () => alunosService.fetchAll(),
    });

    const totalCadastrados = todosAlunos?.length || 0;
    const totalAlunosAtivos = todosAlunos?.filter(a => a.matriculas?.some((m: any) => m.status === 'ativa')).length || 0;
    const alunosOrfaos = todosAlunos?.filter(a => !a.matriculas || a.matriculas.length === 0) || [];

    const { data: turmas, isLoading: loadingTurmas } = useQuery({
        queryKey: ["coordenacao-turmas-ocupacao"],
        queryFn: () => turmasService.fetchAll(),
    });

    const { data: matriculasPendentes, isLoading: loadingPendentes } = useQuery({
        queryKey: ["coordenacao-matriculas-pendentes"],
        queryFn: () => matriculasService.fetchAll({ status: "pendente" }),
    });

    const { data: atividadesAtivas, isLoading: loadingAtividades } = useQuery({
        queryKey: ["coordenacao-atividades-ativas"],
        queryFn: async () => {
            const { count, error } = await supabase.from("atividades").select("*", { count: "exact", head: true }).eq("ativa", true);
            if (error) throw error;
            return count || 0;
        },
    });

    // Calculations
    const totalCapacidade = turmas?.reduce((acc, t) => acc + (t.capacidade_maxima || 0), 0) || 0;
    const totalMatriculados = turmas?.reduce((acc, t) => acc + (t.matriculas?.[0]?.count || 0), 0) || 0;
    const ocupacaoPercent = totalCapacidade > 0 ? (totalMatriculados / totalCapacidade) * 100 : 0;

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-background p-6 lg:p-8 text-foreground space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase italic">
                            Dashboard <span className="text-primary italic">Coordenação</span>
                        </h1>
                        <p className="text-muted-foreground/60 text-sm font-medium uppercase tracking-[0.2em] mt-1">
                            Gestão Operacional · Neo Missio
                        </p>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <GlassCard
                        title="Total de Alunos"
                        value={totalAlunosAtivos?.toString() || "0"}
                        icon={<Users className="h-5 w-5" />}
                        description={`${totalCadastrados} cadastros totais`}
                        trend={{ value: 0, isPositive: true }}
                        color={colors.escuta}
                        isLoading={loadingTodosAlunos}
                    />
                    <GlassCard
                        title="Turmas Ativas"
                        value={turmas?.length?.toString() || "0"}
                        icon={<GraduationCap className="h-5 w-5" />}
                        description="em andamento este mês"
                        color={colors.conhecimento}
                        isLoading={loadingTurmas}
                    />
                    <GlassCard
                        title="Matrículas Pendentes"
                        value={matriculasPendentes?.length?.toString() || "0"}
                        icon={<ClipboardList className="h-5 w-5" />}
                        description="aguardando aprovação"
                        color={colors.conversa}
                        isLoading={loadingPendentes}
                    />
                    <GlassCard
                        title="Ocupação Geral"
                        value={`${ocupacaoPercent.toFixed(1)}%`}
                        icon={<TrendingUp className="h-5 w-5" />}
                        description={`${totalMatriculados}/${totalCapacidade} vagas preenchidas`}
                        trend={{ value: 0, isPositive: true }}
                        color={colors.atividade}
                        isLoading={loadingTurmas}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Funil Visual */}
                    <GlassCard
                        title="Funil de Alunos"
                        description="Conversão da Base"
                        color={colors.conhecimento}
                        icon={<Filter className="h-4 w-4" />}
                    >
                        <div className="flex flex-col gap-6 mt-6">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                    <span>Cadastrados</span>
                                    <span className="text-foreground">{totalCadastrados}</span>
                                </div>
                                <div className="h-4 w-full bg-foreground/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-foreground/20 rounded-full" style={{ width: '100%' }} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                    <span>Matrícula Solicitada</span>
                                    <span className="text-foreground">{totalCadastrados - alunosOrfaos.length}</span>
                                </div>
                                <div className="h-4 w-full bg-foreground/5 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${totalCadastrados ? ((totalCadastrados - alunosOrfaos.length) / totalCadastrados) * 100 : 0}%`, backgroundColor: colors.conversa }} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                    <span>Ativos (Aprovados)</span>
                                    <span style={{ color: colors.escuta }}>{totalAlunosAtivos}</span>
                                </div>
                                <div className="h-4 w-full bg-foreground/5 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${totalCadastrados ? (totalAlunosAtivos / totalCadastrados) * 100 : 0}%`, backgroundColor: colors.escuta, boxShadow: `0 0 10px ${colors.escuta}88` }} />
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Funil de Pendências */}
                    <GlassCard
                        title="Aprovação de Matrículas"
                        color={colors.conversa}
                        icon={<Activity className="h-4 w-4" />}
                    >
                        <div className="flex items-center justify-between mb-4 mt-1">
                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.1em]">Aprovação Necessária</span>
                            {matriculasPendentes && matriculasPendentes.length > 0 && (
                                <Badge className="bg-primary/10 text-primary border-0 text-[9px] font-black px-2 py-0.5">
                                    {matriculasPendentes.length} NOVAS
                                </Badge>
                            )}
                        </div>
                        <ScrollArea className="h-[300px] pr-4">
                            {loadingPendentes ? (
                                <div className="flex items-center justify-center h-full opacity-40">CARREGANDO...</div>
                            ) : matriculasPendentes && matriculasPendentes.length > 0 ? (
                                <div className="space-y-3">
                                    {matriculasPendentes.map((m: any) => (
                                        <div key={m.id} className="group p-3 rounded-xl bg-background/40 border border-white/5 hover:border-primary/30 transition-all flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center font-black text-[10px] text-primary uppercase">
                                                    {m.aluno?.nome_completo?.[0] || "?"}
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-bold tracking-tight">{m.aluno?.nome_completo}</div>
                                                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                                        {m.turma?.atividade?.nome || "Atividade"}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full opacity-40">
                                    <ClipboardList className="h-8 w-8 mb-2" />
                                    <span className="text-[10px] uppercase font-black">Nenhuma pendência</span>
                                </div>
                            )}
                        </ScrollArea>
                    </GlassCard>

                    {/* Taxa de Ocupação por Turma */}
                    <GlassCard
                        title="Ocupação por Turma"
                        color={colors.escuta}
                        icon={<TrendingUp className="h-4 w-4" />}
                    >
                        <ScrollArea className="h-[300px] pr-4 mt-4">
                            <div className="space-y-5">
                                {loadingTurmas ? (
                                    <div className="flex items-center justify-center h-full opacity-20">CARREGANDO...</div>
                                ) : turmas && turmas.length > 0 ? (
                                    turmas.map((turma: any) => {
                                        const mCount = turma.matriculas?.[0]?.count || 0;
                                        const pct = turma.capacidade_maxima > 0 ? (mCount / turma.capacidade_maxima) * 100 : 0;
                                        return (
                                            <div key={turma.id} className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                                    <span className="text-foreground/70 truncate">{turma.nome}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground/60">{mCount}/{turma.capacidade_maxima}</span>
                                                        <span className="text-primary">{pct.toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all duration-1000"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <span className="text-[10px] uppercase font-black opacity-40">Sem turmas registradas</span>
                                )}
                            </div>
                        </ScrollArea>
                    </GlassCard>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-8 border-t border-border/50 opacity-50">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em]">
                        <Activity className="h-3 w-3 text-green-400" />
                        Sistema Ativo · Tempo Real
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DashboardCoordenacao;
