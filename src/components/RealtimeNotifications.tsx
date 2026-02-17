import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const RealtimeNotifications = () => {
    const { toast } = useToast();
    const { user } = useAuth(); // Could be used to filter notifications by role if needed

    useEffect(() => {
        // Channel for Matriculas
        const matriculasChannel = supabase
            .channel('matriculas-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'matriculas'
                },
                (payload) => {
                    console.log('Nova matrícula:', payload);
                    toast({
                        title: "Nova Matrícula Realizada! 🎉",
                        description: "Um novo aluno acabou de se matricular.",
                        duration: 5000,
                        className: "bg-green-500 text-white border-none"
                    });
                }
            )
            .subscribe();

        // Channel for Pagamentos
        const pagamentosChannel = supabase
            .channel('pagamentos-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'pagamentos',
                    filter: 'status=eq.pago'
                },
                (payload) => {
                    const oldStatus = (payload.old as any).status;
                    if (oldStatus !== 'pago') {
                        console.log('Pagamento recebido:', payload);
                        toast({
                            title: "Pagamento Recebido! 💰",
                            description: `Pagamento ID ${payload.new.id} confirmado.`,
                            duration: 5000,
                            className: "bg-blue-500 text-white border-none"
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(matriculasChannel);
            supabase.removeChannel(pagamentosChannel);
        };
    }, [toast]);

    return null; // This component doesn't render anything visible, just toasts
};
