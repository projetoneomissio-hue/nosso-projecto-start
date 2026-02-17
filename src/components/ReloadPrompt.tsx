import { useRegisterSW } from "virtual:pwa-register/react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function ReloadPrompt() {
    const { toast } = useToast();
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    useEffect(() => {
        if (offlineReady) {
            toast({
                title: "App pronto para uso offline",
                description: "Agora você pode usar o Zafen mesmo sem internet.",
            });
            setOfflineReady(false);
        }
    }, [offlineReady, toast, setOfflineReady]);

    useEffect(() => {
        if (needRefresh) {
            toast({
                title: "Nova versão disponível!",
                description: "Clique abaixo para atualizar e ver as novidades.",
                action: (
                    <ToastAction altText="Atualizar" onClick={() => updateServiceWorker(true)}>
                        Atualizar
                    </ToastAction>
                ),
                duration: Infinity, // Keep open until clicked
            });
        }
    }, [needRefresh, toast, updateServiceWorker]);

    return null; // This component doesn't render anything itself, just triggers toasts
}
