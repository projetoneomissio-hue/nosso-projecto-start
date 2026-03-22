import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useNavigate } from "react-router-dom";
import {
    Users,
    DollarSign,
    TrendingUp,
    AlertCircle,
    ArrowUpRight,
    Activity,
    Calendar,
    Filter,
    Download,
    Phone,
    UserMinus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { financeiroService } from "@/services/financeiro.service";
import { matriculasService } from "@/services/matriculas.service";
import { turmasService } from "@/services/turmas.service";
import { alunosService } from "@/services/alunos.service";
import { solicitacoesService } from "@/services/solicitacoes.service";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialImpactDashboard } from "@/components/direcao/SocialImpactDashboard";

interface FinanceiroKPIs {
    receita?: { total: number; liquida: number; repasse_professores: number };
    inadimplencia?: { total: number; vencidos: number; quantidade: number };
}

interface ReceitaAtividade {
    nome: string;
    valor: number;
}

const ManagementDashboard = () => {
    const navigate = useNavigate();

    // Tokens from Design System
    const colors = {
        atividade: "#E8004F",
        conversa: "#FFC200",
        escuta: "#4DD9C0",
        conhecimento: "#6B5CE7",
        quietude: "#001F7A",
    };

    const chartColors = [colors.atividade, colors.conhecimento, colors.escuta, colors.conversa, colors.quietude];

    // Filter State
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    const months = [
        { value: 1, label: "Janeiro" },
        { value: 2, label: "Fevereiro" },
        { value: 3, label: "Março" },
        { value: 4, label: "Abril" },
        { value: 5, label: "Maio" },
        { value: 6, label: "Junho" },
        { value: 7, label: "Julho" },
        { value: 8, label: "Agosto" },
        { value: 9, label: "Setembro" },
        { value: 10, label: "Outubro" },
        { value: 11, label: "Novembro" },
        { value: 12, label: "Dezembro" },
    ];

    const years = [2024, 2025, 2026];
    const [activeTabSub, setActiveTabSub] = useState<string>("leads");

    // Data Fetching
    const { data: todosAlunos, isLoading: loadingTodosAlunos } = useQuery({
        queryKey: ["management-todos-alunos"],
        queryFn: () => alunosService.fetchAll(),
    });

    const totalCadastrados = todosAlunos?.length || 0;
    const totalAlunosAtivos = todosAlunos?.filter(a => a.matriculas?.some((m: any) => m.status === 'ativa')).length || 0;
    const alunosOrfaos = todosAlunos?.filter(a => !a.matriculas || a.matriculas.length === 0) || [];

    const { data: kpis, isLoading: loadingKpis } = useQuery<FinanceiroKPIs>({
        queryKey: ["management-kpis", selectedMonth, selectedYear],
        queryFn: () => financeiroService.fetchFinanceiroKPIs({ month: selectedMonth, year: selectedYear }),
    });

    const { data: fluxocaixa, isLoading: loadingFluxo } = useQuery({
        queryKey: ["management-fluxo-caixa", selectedYear],
        queryFn: async () => {
            const data = await financeiroService.fetchFluxoCaixaMeses(selectedYear);
            return Object.entries(data).map(([mes, values]) => ({
                mes,
                ...values
            }));
        }
    });

    // Helper to get color by activity name
    const getActivityColor = (name: string = "") => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes("jiu")) return colors.atividade; // Rosa
        if (lowerName.includes("desenho")) return colors.conversa; // Amarelo
        if (lowerName.includes("vôlei") || lowerName.includes("volei")) return colors.escuta; // Turquesa
        if (lowerName.includes("pilates")) return colors.conhecimento; // Roxo
        if (lowerName.includes("reforço") || lowerName.includes("reforco")) return colors.quietude; // Azul Escuro
        if (lowerName.includes("ballet") || lowerName.includes("balé")) return "#FFB6C1"; // Rosa Bebê/Claro
        if (lowerName.includes("inglês") || lowerName.includes("ingles")) return "#00A8FF"; // Ciano/Azul Vibrante
        return colors.escuta; // Default
    };

    const { data: rawReceitaAtividade, isLoading: loadingAtividade } = useQuery<ReceitaAtividade[]>({
        queryKey: ["management-receita-atividade"],
        queryFn: () => financeiroService.fetchReceitaPorAtividade(),
    });

    const totalReceitaAtividade = rawReceitaAtividade ? rawReceitaAtividade.reduce((acc, item) => acc + Number(item.valor), 0) : 0;

    const receitaPorAtividadeData = rawReceitaAtividade ? rawReceitaAtividade.map((item) => {
        const val = Number(item.valor);
        const pct = totalReceitaAtividade > 0 ? ((val / totalReceitaAtividade) * 100).toFixed(1) : "0.0";
        return {
            name: item.nome || "Outros",
            value: val,
            percentage: pct,
            color: getActivityColor(item.nome)
        };
    }) : [];

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

    const { data: leadsCounts, isLoading: loadingLeadsCounts } = useQuery({
        queryKey: ["management-leads-counts"],
        queryFn: () => solicitacoesService.fetchCounts(),
    });

    const { data: leadsRecentes, isLoading: loadingLeadsRecentes } = useQuery({
        queryKey: ["management-leads-recentes"],
        queryFn: async () => {
            const data = await solicitacoesService.fetchAll();
            return data.slice(0, 5); // Apenas os 5 mais recentes
        },
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
                            Visão Geral · {months.find(m => m.value === selectedMonth)?.label || ""} {selectedYear}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                            <SelectTrigger className="w-[140px] bg-card border-border/50 hover:border-primary/30 transition-all font-bold shadow-lg">
                                <SelectValue placeholder="Mês" />
                            </SelectTrigger>
                            <SelectContent className="bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl">
                                {months.map((m) => (
                                    <SelectItem
                                        key={m.value}
                                        value={m.value.toString()}
                                        className="font-bold uppercase text-[10px] text-foreground/70 focus:text-foreground focus:bg-primary/20 transition-colors"
                                    >
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                            <SelectTrigger className="w-[100px] bg-card border-border/50 hover:border-primary/30 transition-all font-bold shadow-lg">
                                <SelectValue placeholder="Ano" />
                            </SelectTrigger>
                            <SelectContent className="bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl">
                                {years.map((y) => (
                                    <SelectItem
                                        key={y}
                                        value={y.toString()}
                                        className="font-bold text-[10px] text-foreground/70 focus:text-foreground focus:bg-primary/20 transition-colors"
                                    >
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button className="bg-[#E8004F] hover:bg-[#E8004F]/90 text-white gap-2 shadow-lg shadow-[#E8004F]/20 transition-all active:scale-95 ml-2">
                            <Download className="h-4 w-4" /> Exportar
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="operacional" className="space-y-8 w-full">
                    <TabsList className="bg-card border shadow-sm p-1 rounded-xl h-auto">
                        <TabsTrigger value="operacional" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all font-bold text-sm">
                            Gestão Operacional & Financeira
                        </TabsTrigger>
                        <TabsTrigger value="impacto" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold text-sm">
                            Impacto Social & Alcance
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="operacional" className="space-y-8 mt-6">
                        {/* Status Cards / KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <GlassCard
                                title="Total de Alunos"
                                value={totalAlunosAtivos?.toString() || "0"}
                                icon={<Users className="h-5 w-5" />}
                                description={`${totalCadastrados} cadastros no sistema`}
                                trend={{ value: 0, isPositive: true }}
                                color={colors.escuta}
                        isLoading={loadingTodosAlunos}
                    />
                    <GlassCard
                        title="Receita Líquida (ONG)"
                        value={kpis?.receita?.liquida ? `R$ ${kpis.receita.liquida.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (kpis?.receita?.total ? `R$ ${kpis.receita.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "R$ 0,00")}
                        icon={<DollarSign className="h-5 w-5" />}
                        description={`Repasse Prof: R$ ${kpis?.receita?.repasse_professores?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0,00"}`}
                        trend={{ value: 0, isPositive: true }}
                        color={colors.atividade}
                        isLoading={loadingKpis}
                    />
                    <GlassCard
                        title="Inadimplência"
                        value={kpis?.inadimplencia?.total ? `R$ ${kpis.inadimplencia.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "R$ 0,00"}
                        icon={<AlertCircle className="h-5 w-5" />}
                        description={`${kpis?.inadimplencia?.vencidos || 0} vencidos`}
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
                    <GlassCard
                        title="Novos Interessados"
                        value={leadsCounts?.total?.toString() || "0"}
                        icon={<Activity className="h-5 w-5" />}
                        description={`${leadsCounts?.pendente || 0} fichas completas`}
                        trend={{ value: 0, isPositive: true }}
                        color={colors.escuta}
                        isLoading={loadingLeadsCounts}
                        onClick={() => navigate('/direcao/interessados')}
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
                                        tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
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
                        <div className="flex flex-col items-center justify-center py-6 relative">
                            <div className="relative h-[180px] w-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={receitaPorAtividadeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {receitaPorAtividadeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-background/95 backdrop-blur-md border border-border p-2 rounded-lg shadow-xl outline-none">
                                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                                {payload[0].name}
                                                            </p>
                                                            <div className="flex items-baseline justify-between gap-4">
                                                                <p className="text-sm font-black text-foreground">
                                                                    R$ {Number(payload[0].value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                                </p>
                                                                <p className="text-xs font-black" style={{ color: payload[0].payload.color }}>
                                                                    {payload[0].payload.percentage}%
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Total</span>
                                    <span className="text-xl font-black text-foreground">
                                        R$ {kpis?.receita?.total?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0,00"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Pie Chart Legend */}
                        <div className="flex flex-col gap-2 mt-4 pb-2 max-h-[160px] overflow-y-auto w-full px-2">
                            {receitaPorAtividadeData.map((item, index) => (
                                <div key={`legend-${item.name}-${index}`} className="flex items-center justify-between px-3 py-2 rounded-lg bg-foreground/[0.03] border border-border/50">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs font-black text-muted-foreground uppercase truncate tracking-widest">{item.name}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[11px] font-bold text-foreground">R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                        <span className="text-[9px] font-black" style={{ color: item.color }}>{item.percentage}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Novo Row: Progresso Acadêmico e Recuperação */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Funil Visual (1/3) */}
                    <GlassCard
                        title="Funil de Alunos"
                        description="Conversão da Base"
                        color={colors.conhecimento}
                        icon={<Filter className="h-4 w-4" />}
                    >
                        <div className="flex flex-col gap-4 mt-6">
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
                                    <span>Com Matrícula Solicitada</span>
                                    <span className="text-foreground">{totalCadastrados - alunosOrfaos.length}</span>
                                </div>
                                <div className="h-4 w-full bg-foreground/5 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${totalCadastrados ? ((totalCadastrados - alunosOrfaos.length) / totalCadastrados) * 100 : 0}%`, backgroundColor: colors.conversa }} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                    <span>Alunos Ativos</span>
                                    <span style={{ color: colors.escuta }}>{totalAlunosAtivos}</span>
                                </div>
                                <div className="h-4 w-full bg-foreground/5 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${totalCadastrados ? (totalAlunosAtivos / totalCadastrados) * 100 : 0}%`, backgroundColor: colors.escuta, boxShadow: `0 0 10px ${colors.escuta}88` }} />
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Alunos Sem Matrícula (2/3) */}
                    <GlassCard
                        title="Ações Requeridas: Alunos Órfãos"
                        description="Cadastrados sem escolha de turma"
                        className="lg:col-span-2"
                        color={colors.atividade}
                        icon={<UserMinus className="h-4 w-4" />}
                    >
                        <div className="flex justify-between items-center mb-4 mt-1">
                            <span className="text-xs uppercase font-black tracking-widest text-muted-foreground">Aguardando Contato Comercial</span>
                            <Badge variant="outline" className="bg-[#E8004F]/10 text-[#E8004F] border-[#E8004F]/20 text-xs px-3 font-black uppercase shadow-sm">
                                {alunosOrfaos.length} ALUNOS PARADOS
                            </Badge>
                        </div>
                        <ScrollArea className="h-[180px] pr-4">
                            {loadingTodosAlunos ? (
                                <div className="h-full flex items-center justify-center opacity-40"><Activity className="animate-spin" /></div>
                            ) : alunosOrfaos.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {alunosOrfaos.map((aluno: any) => (
                                        <div key={aluno.id} className="p-3 rounded-xl bg-card/60 border border-border/80 hover:border-[#4DD9C0]/50 transition-all flex justify-between items-center shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-foreground truncate max-w-[140px] leading-tight">{aluno.nome_completo}</span>
                                                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-black mt-0.5">Criado em: {new Date(aluno.created_at).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => {
                                                    const cleanPhone = (aluno.telefone || "").replace(/\D/g, '');
                                                    if (cleanPhone) window.open(`https://wa.me/55${cleanPhone}?text=Olá! Vimos que você iniciou o cadastro de ${aluno.nome_completo.split(' ')[0]} no Neo Missio, mas ainda não escolheu as atividades. Podemos ajudar?`, '_blank');
                                                }}
                                                className="bg-[#25D366] hover:bg-[#25D366]/90 text-white shadow-lg shadow-[#25D366]/20 h-7 rounded-full text-xs font-black uppercase tracking-wider px-3"
                                            >
                                                <Phone className="w-3 h-3 mr-1.5" />
                                                WhatsApp
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <UserMinus className="h-8 w-8 mb-2" />
                                    <span className="text-[11px] font-black uppercase">Excelente! Adoção 100%.</span>
                                </div>
                            )}
                        </ScrollArea>
                    </GlassCard>
                </div>

                {/* Row 4: 3-Column Bottom Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Lista de Matrículas e Interessados */}
                    <GlassCard
                        title="Novas Entradas"
                        color={colors.conhecimento}
                        icon={<Activity className="h-4 w-4" />}
                    >
                        <Tabs defaultValue="leads" value={activeTabSub} onValueChange={setActiveTabSub} className="w-full">
                            <div className="flex items-center justify-between mb-4 mt-1">
                                <TabsList className="bg-foreground/5 h-7 p-0.5">
                                    <TabsTrigger value="leads" className="text-[9px] font-black h-6 uppercase px-3">Interessados</TabsTrigger>
                                    <TabsTrigger value="matriculas" className="text-[9px] font-black h-6 uppercase px-3">Matrículas</TabsTrigger>
                                </TabsList>
                                <Button 
                                    variant="link" 
                                    className="text-[9px] font-black uppercase h-auto p-0 text-primary"
                                    onClick={() => navigate(activeTabSub === "leads" ? "/direcao/interessados" : "/direcao/matriculas-pendentes")}
                                >
                                    Ver tudo
                                </Button>
                            </div>

                            <TabsContent value="leads" className="mt-0">
                                <ScrollArea className="h-[220px] pr-4">
                                    {loadingLeadsRecentes ? (
                                        <div className="flex flex-col items-center justify-center h-full opacity-40 py-8">
                                            <Activity className="h-6 w-6 mb-2 animate-spin" />
                                        </div>
                                    ) : leadsRecentes && leadsRecentes.length > 0 ? (
                                        <div className="space-y-3">
                                            {leadsRecentes.map((lead: any) => (
                                                <div
                                                    key={lead.id}
                                                    onClick={() => navigate('/direcao/interessados')}
                                                    className="group p-3 rounded-xl bg-card/40 border border-border/50 hover:border-primary/30 transition-all flex items-center justify-between shadow-sm cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-escuta/20 text-[#4DD9C0] flex items-center justify-center font-black text-[10px] uppercase">
                                                            {lead.nome_completo?.[0] || "?"}
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] font-bold text-foreground tracking-tight">{lead.nome_completo} {lead.sobrenome}</div>
                                                            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                                                {lead.atividade_desejada || "Interesse Geral"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge className={`text-[8px] font-black uppercase h-5 ${lead.status === 'pendente' ? 'bg-[#FFC200] text-black' : 'bg-blue-500/10 text-blue-500'}`}>
                                                        {lead.status === 'pendente' ? 'FICHA' : 'LEAD'}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full opacity-40 py-8">
                                            <span className="text-[10px] uppercase font-black">Sem novos interessados</span>
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="matriculas" className="mt-0">
                                <ScrollArea className="h-[220px] pr-4">
                                    {loadingPendentes ? (
                                        <div className="flex flex-col items-center justify-center h-full opacity-40 py-8">
                                            <Activity className="h-6 w-6 mb-2 animate-spin" />
                                        </div>
                                    ) : matriculasPendentes && matriculasPendentes.length > 0 ? (
                                        <div className="space-y-3">
                                            {matriculasPendentes.map((m: any) => (
                                                <div
                                                    key={m.id}
                                                    onClick={() => navigate('/direcao/matriculas-pendentes')}
                                                    className="group p-3 rounded-xl bg-card/40 border border-border/50 hover:border-primary/30 transition-all flex items-center justify-between shadow-sm cursor-pointer"
                                                >
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
                                        <div className="flex flex-col items-center justify-center h-full opacity-40 py-8">
                                            <span className="text-[10px] uppercase font-black">Sem matrículas pendentes</span>
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
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
                                    const activityColor = getActivityColor(turma.nome);
                                    const barColor = activityColor; // Mantém a cor fixa da modalidade, independente de lotação

                                    return (
                                        <div key={turma.id} className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                                <span className="text-foreground/70 truncate max-w-[150px]">{turma.nome}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-muted-foreground/60">{mCount}/{turma.capacidade_maxima}</span>
                                                    <span style={{ color: barColor }}>{pct.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: barColor,
                                                        boxShadow: `0 0 8px ${barColor}44`
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
              </TabsContent>

              <TabsContent value="impacto" className="mt-6">
                  <SocialImpactDashboard alunos={todosAlunos || []} />
              </TabsContent>
            </Tabs>

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
