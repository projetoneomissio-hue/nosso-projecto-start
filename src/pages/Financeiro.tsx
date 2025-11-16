import { DashboardLayout } from "@/components/DashboardLayout";

const Financeiro = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground mt-1">
            Controle financeiro completo do projeto
          </p>
        </div>

        <div className="text-center py-12 text-muted-foreground">
          Módulo em desenvolvimento
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Financeiro;
