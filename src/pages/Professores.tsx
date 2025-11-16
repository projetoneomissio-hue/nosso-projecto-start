import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Professores = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Professores</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie professores e comissões
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Professor
          </Button>
        </div>

        <div className="text-center py-12 text-muted-foreground">
          Módulo em desenvolvimento
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Professores;
