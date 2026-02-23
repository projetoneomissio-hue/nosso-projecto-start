
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { turmasService } from "@/services/turmas.service";
import { useToast } from "@/hooks/use-toast";

export function useAvaliacoes(turmaId: string | null) {
    return useQuery({
        queryKey: ["avaliacoes", turmaId],
        queryFn: () => turmaId ? turmasService.fetchAvaliacoes(turmaId) : Promise.resolve([]),
        enabled: !!turmaId,
    });
}

export function useAvaliacaoMutations(turmaId: string | null) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const createAvaliacao = useMutation({
        mutationFn: turmasService.createAvaliacao,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["avaliacoes", turmaId] });
            toast({ title: "Avaliação criada", description: "A avaliação foi registrada com sucesso." });
        },
        onError: (err: any) => {
            toast({ title: "Erro ao criar avaliação", description: err.message, variant: "destructive" });
        }
    });

    const upsertNota = useMutation({
        mutationFn: turmasService.upsertNota,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["avaliacoes", turmaId] });
        },
        onError: (err: any) => {
            toast({ title: "Erro ao salvar nota", description: err.message, variant: "destructive" });
        }
    });

    return { createAvaliacao, upsertNota };
}
