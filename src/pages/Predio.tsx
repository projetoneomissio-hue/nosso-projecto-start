import { DashboardLayout } from "@/components/DashboardLayout";

const Predio = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão do Prédio</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie custos, funcionários e locações
          </p>
        </div>

        <div className="text-center py-12 text-muted-foreground">
          Módulo em desenvolvimento
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Predio;
