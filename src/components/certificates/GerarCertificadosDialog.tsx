import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Download, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { turmasService } from "@/services/turmas.service";
import { supabase } from "@/integrations/supabase/client";
import { pdf } from "@react-pdf/renderer";
import CertificateTemplate from "./CertificateTemplate";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";
import { useUnidade } from "@/contexts/UnidadeContext";

interface GerarCertificadosDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    turma: any;
}

export function GerarCertificadosDialog({ open, onOpenChange, turma }: GerarCertificadosDialogProps) {
    const [selectedAlunos, setSelectedAlunos] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const { currentUnidade } = useUnidade();
    const queryClient = useQueryClient();

    // Buscar alunos da turma
    const { data: alunos, isLoading: isLoadingAlunos } = useQuery({
        queryKey: ["alunos-turma-certificados", turma?.id],
        queryFn: () => turmasService.fetchAlunosDaTurma(turma.id),
        enabled: !!turma?.id && open,
    });

    // Filtrar apenas alunos ATIVOS (ou Concluídos se tiver status)
    // Por enquanto, mostra todos com status 'ativa'
    const alunosElegiveis = alunos?.filter((a: any) => a.status_matricula === "ativa") || [];

    const handleSelectAll = () => {
        if (selectedAlunos.length === alunosElegiveis.length) {
            setSelectedAlunos([]);
        } else {
            setSelectedAlunos(alunosElegiveis.map((a: any) => a.aluno_id));
        }
    };

    const toggleAluno = (alunoId: string) => {
        if (selectedAlunos.includes(alunoId)) {
            setSelectedAlunos(selectedAlunos.filter((id) => id !== alunoId));
        } else {
            setSelectedAlunos([...selectedAlunos, alunoId]);
        }
    };

    const handleGenerate = async () => {
        if (selectedAlunos.length === 0) return;
        setIsGenerating(true);

        try {
            const certificatesData = [];

            // 1. Para cada aluno selecionado, criar registro e preparar dados
            for (const alunoId of selectedAlunos) {
                const alunoInfo = alunosElegiveis.find((a: any) => a.aluno_id === alunoId);
                if (!alunoInfo) continue;

                const codigoValidacao = nanoid(10).toUpperCase();

                // Verificar se já existe certificado para esta matrícula?
                // Opcional: Poderia checar antes, mas vamos permitir regeração (novos registros ou update).
                // Vamos criar novo registro sempre para simplificar histórico.

                const { error } = await supabase.from("certificados").insert({
                    aluno_id: alunoId,
                    matricula_id: alunoInfo.id,
                    unidade_id: currentUnidade?.id,
                    codigo_validacao: codigoValidacao,
                    nome_curso: turma.atividade?.nome || "Curso Livre", // Snapshot nome
                    carga_horaria_horas: 20, // TODO: Pegar da turma/atividade se tiver
                    status: "emitido",
                });

                if (error) throw error;

                certificatesData.push({
                    alunoNome: alunoInfo.nome_completo,
                    cursoNome: turma.atividade?.nome || "Curso Livre",
                    cargaHoraria: 20, // Placeholder ou pegar da atividade
                    dataEmissao: new Date(),
                    codigoValidacao: codigoValidacao,
                    nomeUnidade: currentUnidade?.nome || "Zafen ONG",
                });
            }

            // 2. Gerar PDF único
            const blob = await pdf(<CertificateTemplate certificados={certificatesData} />).toBlob();

            // 3. Download
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `certificados-${turma.nome}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({
                title: "Certificados Gerados!",
                description: `${certificatesData.length} certificados foram criados e baixados.`,
            });

            onOpenChange(false);
            setSelectedAlunos([]);

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao gerar certificados",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Gerar Certificados</DialogTitle>
                    <DialogDescription>
                        Selecione os alunos para emitir o certificado de conclusão da turma <strong>{turma?.nome}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                            id="select-all"
                            checked={alunosElegiveis.length > 0 && selectedAlunos.length === alunosElegiveis.length}
                            onCheckedChange={handleSelectAll}
                        />
                        <Label htmlFor="select-all" className="font-semibold">Selecionar Todos ({alunosElegiveis.length})</Label>
                    </div>

                    <ScrollArea className="h-[300px] border rounded-md p-4">
                        {isLoadingAlunos ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                        ) : alunosElegiveis.length === 0 ? (
                            <p className="text-center text-muted-foreground">Nenhum aluno ativo encontrado nesta turma.</p>
                        ) : (
                            <div className="space-y-3">
                                {alunosElegiveis.map((aluno: any) => (
                                    <div key={aluno.aluno_id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`aluno-${aluno.aluno_id}`}
                                            checked={selectedAlunos.includes(aluno.aluno_id)}
                                            onCheckedChange={() => toggleAluno(aluno.aluno_id)}
                                        />
                                        <Label htmlFor={`aluno-${aluno.aluno_id}`} className="cursor-pointer flex-1">
                                            {aluno.nome_completo}
                                        </Label>
                                        <BadgeStatus status={aluno.status_matricula} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleGenerate} disabled={selectedAlunos.length === 0 || isGenerating}>
                        {isGenerating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Gerar {selectedAlunos.length > 0 ? `(${selectedAlunos.length})` : ""}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function BadgeStatus({ status }: { status: string }) {
    if (status === "ativa") return <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Ativo</span>;
    return <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">{status}</span>;
}
