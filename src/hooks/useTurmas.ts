import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { turmasService } from "@/services/turmas.service";
import { useToast } from "@/hooks/use-toast";
import { handleError } from "@/utils/error-handler";

/** Hook para listar turmas com atividade, professor e contagem de matrículas */
export function useTurmas() {
    return useQuery({
        queryKey: ["turmas-coordenacao"],
        queryFn: turmasService.fetchAll,
    });
}

/** Hook para listar alunos de uma turma específica */
export function useTurmaAlunos(turmaId: string | null) {
    return useQuery({
        queryKey: ["turma-alunos", turmaId],
        queryFn: () => turmaId ? turmasService.fetchAlunosDaTurma(turmaId) : Promise.resolve([]),
        enabled: !!turmaId,
    });
}

/** Hook para selects de atividades ativas */
export function useAtividades() {
    return useQuery({
        queryKey: ["atividades-select"],
        queryFn: turmasService.fetchAtividades,
    });
}

/** Hook para selects de professores ativos */
export function useProfessores() {
    return useQuery({
        queryKey: ["professores-select"],
        queryFn: turmasService.fetchProfessores,
    });
}

/** Hook para mutações de turmas (create/update/delete) */
export function useTurmaMutations() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const saveMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id?: string;
            data: {
                nome: string;
                atividade_id: string;
                professor_id: string | null;
                horario: string;
                dias_semana: string[];
                capacidade_maxima: number;
                ativa: boolean;
            };
        }) => {
            if (id) {
                await turmasService.update(id, data);
            } else {
                await turmasService.create(data);
            }
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["turmas-coordenacao"] });
            toast({
                title: variables.id ? "Turma atualizada" : "Turma criada",
                description: variables.id
                    ? "A turma foi atualizada com sucesso."
                    : "A turma foi criada com sucesso.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erro",
                description: error.message || "Não foi possível salvar a turma.",
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: turmasService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["turmas-coordenacao"] });
            toast({
                title: "Turma excluída",
                description: "A turma foi excluída com sucesso.",
            });
        },
        onError: (error: any) => {
            handleError(error, "Erro ao excluir turma");
        },
    });

    return { saveMutation, deleteMutation };
}
