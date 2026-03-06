import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alunosService } from "@/services/alunos.service";
import { useToast } from "@/hooks/use-toast";

/** Hook para listar alunos com matrículas */
export function useAlunos() {
    return useQuery({
        queryKey: ["alunos"],
        queryFn: alunosService.fetchAll,
    });
}

/** Hook para mutações de alunos (create/update/delete) */
export function useAlunoMutations() {
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
                data_nascimento: string;
                cpf: string;
                telefone: string;
                endereco?: string;
                responsavel_id?: string;
                alergias?: string;
                medicamentos?: string;
                observacoes?: string;
                foto_url?: string;
            };
        }) => {
            if (id) {
                await alunosService.update(id, data);
            } else {
                await alunosService.create(data);
            }
        },
        onSuccess: (_data, variables) => {
            toast({
                title: "Sucesso!",
                description: `Aluno ${variables.id ? "atualizado" : "cadastrado"}.`,
            });
            queryClient.invalidateQueries({ queryKey: ["alunos"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: alunosService.delete,
        onSuccess: () => {
            toast({ title: "Aluno removido" });
            queryClient.invalidateQueries({ queryKey: ["alunos"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao remover",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteManyMutation = useMutation({
        mutationFn: alunosService.deleteMany,
        onSuccess: (_data, ids) => {
            toast({ title: `${ids.length} aluno(s) removido(s)` });
            queryClient.invalidateQueries({ queryKey: ["alunos"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao remover alunos",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteAllMutation = useMutation({
        mutationFn: alunosService.deleteAll,
        onSuccess: () => {
            toast({ title: "Todos os alunos foram removidos" });
            queryClient.invalidateQueries({ queryKey: ["alunos"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao remover todos os alunos",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return { saveMutation, deleteMutation, deleteManyMutation, deleteAllMutation };
}
