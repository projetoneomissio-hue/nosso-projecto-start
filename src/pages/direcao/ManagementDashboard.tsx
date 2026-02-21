import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import {
    Users,
    DollarSign,
    TrendingUp,
    AlertCircle,
    ArrowUpRight,
    Activity,
    Calendar,
    Filter,
    Download
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { financeiroService } from "@/services/financeiro.service";
import { matriculasService } from "@/services/matriculas.service";
import { turmasService } from "@/services/turmas.service";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const ManagementDashboard = () => {
    // Tokens from Design System
    const colors = {
        atividade: "#E8004F",
        conversa: "#FFC200",
        escuta: "#4DD9C0",
        conhecimento: "#6B5CE7",
        quietude: "#001F7A",
    };

    const chartColors = [colors.atividade, colors.conhecimento, colors.escuta, colors.conversa, colors.quietude];

    // Data Fetching
    const { data: totalAlunos, isLoading: loadingAlunos } = useQuery({
        queryKey: ["management-total-alunos"],
        queryFn: async () => {
            const { count, error } = await supabase.from("alunos").select("*", { count: "exact", head: true });
            if (error) throw error;
            return count;
        },
    });

    const { data: kpis, isLoading: loadingKpis } = useQuery({
        queryKey: ["management-kpis"],
        queryFn: () => financeiroService.fetchFinanceiroKPIs(),
    });

    const { data: fluxocaixa, isLoading: loadingFluxo } = useQuery({
        queryKey: ["management-fluxo-caixa"],
        queryFn: async () => {
            const data = await financeiroService.fetchFluxoCaixaMeses();
            return Object.entries(data).map(([mes, values]) => ({
                mes,
                ...values
            }));
        }
    });

    const { data: receitaAtividade, isLoading: loadingAtividade } = useQuery({
        queryKey: ["management-receita-atividade"],
        queryFn: () => financeiroService.fetchReceitaPorAtividade(),
    });

    const { data: inadimplentes, isLoading: loadingInadimplentes } = useQuery({
        queryKey: ["management-inadimplentes"],
        queryFn: () => financeiroService.fetchInadimplentesOtimizado(),
    });

    const { data: matriculasPendentes, isLoading: loadingPendentes } = useQuery({
        queryKey: ["management-matriculas-pendentes"],
        queryFn: () => matriculasService.fetchAll({ status: "pendente" }),
    });

    const { data: turmas, isLoading: loadingTurmas } = useQuery({
        queryKey: ["management-turmas-ocupacao"],
        queryFn: () => turmasService.fetchAll(),
    });

    // Helper to calculate total occupation
    const totalCapacidade = turmas?.reduce((acc, t) => acc + (t.capacidade_maxima || 0), 0) || 0;
    const totalMatriculados = turmas?.reduce((acc, t) => acc + (t.matriculas?.[0]?.count || 0), 0) || 0;
    const ocupacaoPercent = totalCapacidade > 0 ? (totalMatriculados / totalCapacidade) * 100 : 0;

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-background p-6 lg:p-8 text-foreground space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase italic transition-all duration-300">
                            Dashboard <span className="text-[#E8004F] transition-colors duration-300">Diretoria</span>
                        </h1>
                        <p className="text-muted-foreground/60 text-sm font-medium uppercase tracking-[0.2em] mt-1">
                            Visão Geral · {format(new Date(), "MMMM yyyy", { locale: ptBR })}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="bg-card/50 border-border hover:bg-card/80 gap-2 transition-all">
                            <Filter className="h-4 w-4" /> Todas as Unidades
                        </Button>
                        <Button className="bg-[#E8004F] hover:bg-[#E8004F]/90 text-white gap-2 shadow-lg shadow-[#E8004F]/20 transition-all active:scale-95">
                            <Download className="h-4 w-4" /> Exportar
                        </Button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <GlassCard
                        title="Total de Alunos"
                        value={totalAlunos?.toString() || "0"}
                        icon={<Users className="h-5 w-5" />}
                        description="matriculados ativos"
                        trend={{ value: 0, isPositive: true }}
                        color={colors.escuta}
                        isLoading={loadingAlunos}
                    />
                    <GlassCard
                        title="Receita Mensal"
                        value={kpis?.receita?.total ? `R$ ${(kpis.receita.total / 1000).toFixed(1)}k` : "R$ 0.0k"}
                        icon={<DollarSign className="h-5 w-5" />}
                        description="Mensalidade"
                        trend={{ value: 0, isPositive: true }}
                        color={colors.atividade}
                        isLoading={loadingKpis}
                    />
                    <GlassCard
                        title="Inadimplência"
                        value={kpis?.inadimplencia?.total ? `R$ ${(kpis.inadimplencia.total / 1000).toFixed(1)}k` : "R$ 0.0k"}
                        icon={<AlertCircle className="h-5 w-5" />}
                        description="vencidos"
                        trend={{ value: 0, isPositive: false }}
                        color={colors.conversa}
                        isLoading={loadingKpis}
                    />
                    <GlassCard
                        title="Ocupação Geral"
                        value={`${ocupacaoPercent.toFixed(1)}%`}
                        icon={<TrendingUp className="h-5 w-5" />}
                        description={`${totalMatriculados}/${totalCapacidade} vagas`}
                        trend={{ value: 0, isPositive: true }}
                        color={colors.conhecimento}
                        isLoading={loadingTurmas}
                    />
                </div>

                {/* Row 2: Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Fluxo de Caixa (2/3) */}
                    <GlassCard
                        title="Fluxo de Caixa"
                        description="Receitas vs. Despesas · 7 meses"
                        className="lg:col-span-2"
                        color={colors.atividade}
                    >
                        <div className="h-[280px] w-full mt-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={fluxocaixa || []}>
                                    <defs>
                                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={colors.atividade} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={colors.atividade} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={colors.conhecimento} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={colors.conhecimento} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.05} vertical={false} />
                                    <XAxis
                                        dataKey="mes"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "currentColor", opacity: 0.4, fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "currentColor", opacity: 0.4, fontSize: 10, fontWeight: 700 }}
                                        tickFormatter={(value) => `R$ ${value / 1000}k`}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: colors.atividade, strokeWidth: 1, strokeDasharray: '4 4' }}
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "16px",
                                            padding: "12px"
                                        }}
                                        itemStyle={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="receita"
                                        stroke={colors.atividade}
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorReceita)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="despesa"
                                        stroke={colors.conhecimento}
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorDespesa)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>

                    {/* Receita por Atividade (1/3) */}
                    <GlassCard
                        title="Distribuição"
                        description="Receita por Atividade"
                        color={colors.conversa}
                        icon={<Activity className="h-4 w-4" />}
                    >
                        <div className="flex flex-col gap-6 mt-4">
                            <div className="w-full h-[160px] relative flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={receitaAtividade || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={4}
                                            dataKey="valor"
                                            stroke="none"
                                        >
                                            {(receitaAtividade || []).map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={chartColors[index % chartColors.length]}
                                                    className="hover:opacity-80 transition-opacity"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "12px"
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xl font-black text-foreground">
                                        R$ {((kpis?.receita?.total || 0) / 1000).toFixed(1)}k
                                    </span>
                                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.1em] opacity-40">Total</span>
                                </div>
                            </div>

                            <div className="w-full space-y-2">
                                {(receitaAtividade || []).slice(0, 5).map((item: any, index: number) => (
                                    <div key={item.nome} className="flex items-center justify-between group cursor-default py-1 px-2 rounded-lg hover:bg-foreground/[0.03] transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-2 w-2 rounded-full"
                                                style={{ backgroundColor: chartColors[index % chartColors.length] }}
                                            />
                                            <span className="text-[10px] text-foreground/80 font-bold tracking-tight truncate max-w-[90px]">{item.nome}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-foreground">R$ {(item.valor / 1000).toFixed(1)}k</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Row 4: 3-Column Bottom Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Funil de Matrículas */}
                    <GlassCard
                        title="Funil de Matrículas"
                        color={colors.conhecimento}
                        icon={<Activity className="h-4 w-4" />}
                    >
                        <div className="flex items-center justify-between mb-4 mt-1">
                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.1em]">Aprovação pendente</span>
                            {matriculasPendentes && matriculasPendentes.length > 0 && (
                                <Badge variant="outline" className="bg-[#FFC200]/10 text-[#FFC200] border-0 text-[9px] font-black px-2 py-0.5">
                                    {matriculasPendentes.length} PENDENTES
                                </Badge>
                            )}
                        </div>
                        <ScrollArea className="h-[260px] pr-4">
                            {loadingPendentes ? (
                                <div className="space-y-3 flex flex-col items-center justify-center h-full opacity-40">
                                    <Activity className="h-8 w-8 mb-2 animate-spin" />
                                    <span className="text-[10px] uppercase font-black">Carregando...</span>
                                </div>
                            ) : matriculasPendentes && matriculasPendentes.length > 0 ? (
                                <div className="space-y-3">
                                    {matriculasPendentes.map((m: any) => (
                                        <div key={m.id} className="group p-3 rounded-xl bg-card/40 border border-border/50 hover:border-primary/30 transition-all flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-black text-[10px] text-white uppercase">
                                                    {m.aluno?.nome_completo?.[0] || "?"}
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-bold text-foreground tracking-tight">{m.aluno?.nome_completo}</div>
                                                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                                        {m.turma?.atividade?.nome || "Sem Atividade"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-green-500/20 text-green-500">
                                                    <ArrowUpRight className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3 flex flex-col items-center justify-center h-full opacity-40">
                                    <Activity className="h-8 w-8 mb-2" />
                                    <span className="text-[10px] uppercase font-black">Sem novas matrículas</span>
                                </div>
                            )}
                        </ScrollArea>
                    </GlassCard>

                    {/* Middle: Alerta de Inadimplência */}
                    <GlassCard
                        title="Inadimplência"
                        color={colors.conversa}
                        icon={<AlertCircle className="h-4 w-4" />}
                    >
                        <div className="flex items-center justify-between mb-4 mt-1">
                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.1em]">Casos Críticos</span>
                            <Badge variant="outline" className="bg-[#E8004F]/10 text-[#E8004F] border-0 text-[9px] font-black px-2 py-0.5">TOP 5</Badge>
                        </div>
                        <ScrollArea className="h-[260px] pr-4">
                            <div className="space-y-3">
                                {(inadimplentes || []).slice(0, 5).map((p: any) => (
                                    <div key={p.id} className="p-3 rounded-xl bg-card/40 border border-border/50 flex items-center justify-between group transition-all hover:border-[#E8004F]/30">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-[#E8004F]/5 flex items-center justify-center text-[#E8004F] font-black text-[10px]">
                                                {p.matricula?.aluno?.nome_completo?.[0] || "?"}
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-bold text-foreground leading-none tracking-tight truncate max-w-[100px]">{p.matricula?.aluno?.nome_completo}</div>
                                                <div className="text-[9px] font-black text-muted-foreground uppercase mt-1 opacity-50 truncate max-w-[100px]">
                                                    {p.matricula?.turma?.atividade?.nome}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[11px] font-black text-[#E8004F]">R$ {p.valor}</div>
                                            <div className="text-[8px] text-[#E8004F]/60 font-black uppercase mt-0.5">23d atraso</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </GlassCard>

                    {/* Right: Taxa de Ocupação */}
                    <GlassCard
                        title="Ocupação"
                        description="Vagas preenchidas"
                        color={colors.escuta}
                        icon={<TrendingUp className="h-4 w-4" />}
                    >
                        <div className="space-y-5 mt-4">
                            {loadingTurmas ? (
                                <div className="flex flex-col items-center justify-center h-[200px] opacity-20">
                                    <Activity className="h-8 w-8 mb-2 animate-spin" />
                                    <span className="text-[9px] uppercase font-black">Carregando turmas...</span>
                                </div>
                            ) : turmas && turmas.length > 0 ? (
                                turmas.map((turma: any) => {
                                    const mCount = turma.matriculas?.[0]?.count || 0;
                                    const pct = turma.capacidade_maxima > 0 ? (mCount / turma.capacidade_maxima) * 100 : 0;
                                    return (
                                        <div key={turma.id} className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                                <span className="text-foreground/70 truncate max-w-[120px]">{turma.nome}</span>
                                                <span style={{ color: pct > 80 ? colors.atividade : colors.escuta }}>{pct.toFixed(0)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: pct > 80 ? colors.atividade : colors.escuta,
                                                        boxShadow: `0 0 8px ${pct > 80 ? colors.atividade : colors.escuta}44`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[200px] opacity-20">
                                    <TrendingUp className="h-8 w-8 mb-2" />
                                    <span className="text-[9px] uppercase font-black">Nenhuma turma registrada</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 p-3 rounded-xl bg-[#E8004F]/5 border border-[#E8004F]/10 flex gap-3 items-center animate-pulse">
                            <AlertCircle className="h-4 w-4 text-[#E8004F] shrink-0" />
                            <p className="text-[9px] font-black text-[#E8004F] uppercase tracking-widest leading-tight">
                                Reforço Escolar está lotado.
                            </p>
                        </div>
                    </GlassCard>
                </div>

                {/* Footer info */}
                <div className="flex justify-between items-center pt-8 border-t border-border/50 opacity-50">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em]">
                        <Activity className="h-3 w-3 text-green-400" />
                        Dados atualizados em tempo real via Supabase
                    </div>
                    <div className="text-[10px] font-medium tracking-widest grayscale opacity-50">
                        NEO MISSIO · GESTÃO ONG
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ManagementDashboard;
