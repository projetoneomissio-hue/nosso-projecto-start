import { DashboardLayout } from "@/components/DashboardLayout";
import { RelatorioFrequencia } from "@/components/reports/RelatorioFrequencia";
import { RelatorioFinanceiro } from "@/components/reports/RelatorioFinanceiro";
import { MarketingDashboard } from "@/components/reports/MarketingDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditLogList } from "@/components/admin/AuditLogList";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert } from "lucide-react";

const Relatorios = () => {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios da Coordenação</h1>
          <p className="text-muted-foreground mt-1">
            Visão consolidada da escola
          </p>
        </div>

        <Tabs defaultValue="pedagogico" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pedagogico">Pedagógico & Frequência</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="marketing">Marketing & Aquisição</TabsTrigger>
            {user?.role === "direcao" && (
              <TabsTrigger value="auditoria" className="gap-2">
                <ShieldAlert className="h-4 w-4" />
                Auditoria
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="pedagogico" className="space-y-4">
            <RelatorioFrequencia />
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/20">
              <RelatorioFinanceiro />
            </div>
          </TabsContent>

          <TabsContent value="marketing" className="space-y-4">
            <MarketingDashboard />
          </TabsContent>

          {user?.role === "direcao" && (
            <TabsContent value="auditoria" className="space-y-4">
              <AuditLogList />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;
