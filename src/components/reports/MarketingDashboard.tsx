import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingUp, Users, Target } from "lucide-react";

interface UTMData {
    source: string;
    medium: string;
    campaign: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export const MarketingDashboard = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["marketing-stats"],
        queryFn: async () => {
            // Fetch students with UTM data
            const { data: alunos } = await supabase
                .from("alunos")
                .select("id, origem_cadastro, created_at");

            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, codigo_indicacao, convidado_por");

            // Process UTM sources
            const sources: Record<string, number> = {};
            const campaigns: Record<string, number> = {};

            alunos?.forEach((aluno) => {
                const utm = aluno.origem_cadastro as UTMData | null;
                if (utm?.source) {
                    sources[utm.source] = (sources[utm.source] || 0) + 1;
                } else {
                    sources["Direto/Outros"] = (sources["Direto/Outros"] || 0) + 1;
                }

                if (utm?.campaign) {
                    campaigns[utm.campaign] = (campaigns[utm.campaign] || 0) + 1;
                }
            });

            // Count referrals
            const referralsCount = profiles?.filter(p => p.convidado_por).length || 0;

            const sourceData = Object.entries(sources).map(([name, value]) => ({ name, value }));

            return {
                totalLeads: alunos?.length || 0,
                referrals: referralsCount,
                sourceChart: sourceData,
            };
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Matrículas</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalLeads}</div>
                        <p className="text-xs text-muted-foreground">Alunos cadastrados</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Indicações</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.referrals}</div>
                        <p className="text-xs text-muted-foreground">Usuários convidados por código</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taxa de Conversão da Landing</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--%</div>
                        <p className="text-xs text-muted-foreground">Integração PostHog pendente</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Origem das Matrículas</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.sourceChart}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats?.sourceChart.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            {stats?.sourceChart.map((entry, index) => (
                                <div key={index} className="flex items-center gap-1 text-xs">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span>{entry.name}: {entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Nota de Melhoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Para métricas mais detalhadas de conversão (funil), recomendamos consultar diretamente o painel do PostHog configurado na Sprint 1.
                            Este painel foca nos dados de origem final (conversão realizada).
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
