import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Unidade {
    id: string;
    nome: string;
    slug: string;
    logo_url?: string;
}

interface UnidadeContextType {
    currentUnidade: Unidade | null;
    unidades: Unidade[];
    isLoading: boolean;
    switchUnidade: (unidadeId: string) => void;
}

const UnidadeContext = createContext<UnidadeContextType | undefined>(undefined);

export const useUnidade = () => {
    const context = useContext(UnidadeContext);
    if (!context) {
        throw new Error("useUnidade must be used within UnidadeProvider");
    }
    return context;
};

export const UnidadeProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [currentUnidade, setCurrentUnidade] = useState<Unidade | null>(null);
    const [unidades, setUnidades] = useState<Unidade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!user) {
            setUnidades([]);
            setCurrentUnidade(null);
            setIsLoading(false);
            return;
        }

        const fetchUnidades = async () => {
            setIsLoading(true);
            try {
                // Busca as unidades vinculadas ao usuário
                const { data, error } = await supabase
                    .from("user_unidades")
                    .select(`
            unidade_id,
            unidade:unidades (
              id,
              nome,
              slug,
              logo_url
            )
          `)
                    .eq("user_id", user.id);

                if (error) throw error;

                // Formata o resultado (flat)
                const userUnidades = data
                    .map((item: any) => item.unidade)
                    .filter(Boolean) as Unidade[];

                setUnidades(userUnidades);

                // Tenta recuperar do localStorage ou define a primeira/matriz
                const storedId = localStorage.getItem("@zafen:unidade_id");
                const found = userUnidades.find((u) => u.id === storedId);

                if (found) {
                    setCurrentUnidade(found);
                } else if (userUnidades.length > 0) {
                    // Default: pega a primeira (geralmente Matriz se foi a inserida)
                    const defaultUnidade = userUnidades[0];
                    setCurrentUnidade(defaultUnidade);
                    localStorage.setItem("@zafen:unidade_id", defaultUnidade.id);
                }
            } catch (error) {
                console.error("Erro ao buscar unidades:", error);
                toast({
                    title: "Erro de Unidade",
                    description: "Não foi possível carregar as escolas vinculadas.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchUnidades();
    }, [user]);

    const switchUnidade = (unidadeId: string) => {
        const target = unidades.find((u) => u.id === unidadeId);
        if (target) {
            setCurrentUnidade(target);
            localStorage.setItem("@zafen:unidade_id", target.id);

            // Opcional: Recarregar a página para limpar caches do React Query que podem ser de outra unidade
            // window.location.reload(); 
            // Por enquanto vamos confiar no QueryKey invalidador se implementarmos depois
            toast({
                title: "Unidade Alterada",
                description: `Você agora está acessando: ${target.nome}`,
            });
        }
    };

    return (
        <UnidadeContext.Provider
            value={{
                currentUnidade,
                unidades,
                isLoading,
                switchUnidade,
            }}
        >
            {children}
        </UnidadeContext.Provider>
    );
};
