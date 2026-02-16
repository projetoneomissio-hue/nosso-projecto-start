import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { supabase } from "@/integrations/supabase/client";
import { ListaAlunosPDF } from "./ListaAlunos";
import { useToast } from "@/hooks/use-toast";

interface DownloadListaChamadaProps {
    turmaId: string;
    turmaNome: string; // Generic name to show while loading or if fetch fails
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
}

export const DownloadListaChamada = ({
    turmaId,
    turmaNome,
    variant = "outline",
    size = "sm"
}: DownloadListaChamadaProps) => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click

        try {
            setLoading(true);
            toast({
                title: "Gerando lista...",
                description: "Buscando dados e gerando PDF.",
            });

            // 1. Fetch Turma Details (Professor, Dias, Horário)
            const { data: turmaData, error: turmaError } = await supabase
                .from("turmas")
                .select(`
          nome,
          horario,
          dias_semana,
          professor:profiles!turmas_professor_id_fkey(nome_completo)
        `)
                .eq("id", turmaId)
                .single();

            if (turmaError) throw turmaError;

            // 2. Fetch Active/Pending Students
            const { data: matriculas, error: matError } = await supabase
                .from("matriculas")
                .select(`
          status,
          created_at,
          aluno:alunos(
            nome_completo,
            cpf,
            responsavel:profiles!alunos_responsavel_id_fkey(nome_completo)
          )
        `)
                .eq("turma_id", turmaId)
                .in("status", ["ativa", "pendente"])
                .order("aluno(nome_completo)");

            if (matError) throw matError;

            // 3. Format Data
            const formattedAlunos = matriculas.map((m: any) => ({
                nome: m.aluno.nome_completo,
                cpf: m.aluno.cpf,
                responsavel: m.aluno.responsavel?.nome_completo,
                status: m.status,
                dataMatricula: m.created_at,
            }));

            const formattedTurma = {
                nome: turmaData.nome,
                dias: turmaData.dias_semana || [],
                horario: turmaData.horario,
                professor: turmaData.professor?.nome_completo || "Não informado",
            };

            // 4. Generate PDF
            const blob = await pdf(
                <ListaAlunosPDF turma={formattedTurma} alunos={formattedAlunos} />
            ).toBlob();

            // 5. Download
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `lista_chamada_${turmaNome.replace(/\s+/g, "_").toLowerCase()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({
                title: "Sucesso!",
                description: "Lista de presença baixada.",
            });

        } catch (error: any) {
            console.error("Erro ao gerar PDF:", error);
            toast({
                title: "Erro ao gerar PDF",
                description: error.message || "Tente novamente mais tarde.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleDownload}
            disabled={loading}
            className={loading ? "cursor-not-allowed" : ""}
            title="Baixar Lista de Chamada"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <FileText className="h-4 w-4" />
            )}
            {size !== "icon" && <span className="ml-2">Lista</span>}
        </Button>
    );
};
