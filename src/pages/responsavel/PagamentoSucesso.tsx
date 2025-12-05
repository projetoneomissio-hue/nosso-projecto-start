import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const PagamentoSucesso = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const paymentId = searchParams.get("payment_id");

  useEffect(() => {
    // Invalidate payment queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
    queryClient.invalidateQueries({ queryKey: ["pagamentosPendentes"] });
  }, [queryClient]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-md w-full border-green-500/30 bg-green-500/5">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-500/20 p-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Pagamento Realizado!
              </h1>
              <p className="text-muted-foreground">
                Seu pagamento foi processado com sucesso. O status será atualizado em breve.
              </p>
            </div>

            {paymentId && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">ID do Pagamento:</span>
                </p>
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {paymentId}
                </p>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <Button 
                onClick={() => navigate("/responsavel/pagamentos")} 
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver Meus Pagamentos
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate("/responsavel/dashboard")}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PagamentoSucesso;
