import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { Users, GraduationCap, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao sistema de gestão Neo Missio
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Total de Alunos"
            value="156"
            icon={Users}
            description="Alunos ativos"
            trend={{ value: 12, isPositive: true }}
          />
          <DashboardCard
            title="Atividades Ativas"
            value="7"
            icon={GraduationCap}
            description="Modalidades oferecidas"
          />
          <DashboardCard
            title="Receita Mensal"
            value="R$ 24.500"
            icon={DollarSign}
            description="Mensalidades + locações"
            trend={{ value: 8, isPositive: true }}
          />
          <DashboardCard
            title="Taxa de Ocupação"
            value="87%"
            icon={TrendingUp}
            description="Capacidade utilizada"
            trend={{ value: 5, isPositive: true }}
          />
        </div>

        {/* Quick Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atividades Populares</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Jiu-Jitsu</span>
                <span className="text-sm font-medium text-primary">45 alunos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Balé</span>
                <span className="text-sm font-medium text-primary">38 alunos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Reforço Escolar</span>
                <span className="text-sm font-medium text-primary">32 alunos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Música</span>
                <span className="text-sm font-medium text-primary">25 alunos</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pagamentos Pendentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Vencidos</span>
                <span className="text-sm font-medium text-destructive">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Vencem em 7 dias</span>
                <span className="text-sm font-medium text-warning">15</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Em dia</span>
                <span className="text-sm font-medium text-success">133</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ocupação Semanal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Segunda-feira</span>
                <span className="text-sm font-medium text-primary">92%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Quarta-feira</span>
                <span className="text-sm font-medium text-primary">88%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Sexta-feira</span>
                <span className="text-sm font-medium text-primary">85%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Sábado</span>
                <span className="text-sm font-medium text-primary">65%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
