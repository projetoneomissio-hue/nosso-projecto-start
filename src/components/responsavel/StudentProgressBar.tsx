import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface StudentProgressBarProps {
  aluno: any;
}

export const StudentProgressBar = ({ aluno }: StudentProgressBarProps) => {
  const calculateProgress = () => {
    let score = 0;
    if (aluno.nome_completo) score += 20;
    if (aluno.data_nascimento && aluno.data_nascimento !== "1900-01-01") score += 20;
    if (aluno.cpf) score += 20;
    if (aluno.foto_url) score += 20;
    if (aluno.anamneses && aluno.anamneses.length > 0) score += 20;
    return score;
  };

  const progress = calculateProgress();
  const isComplete = progress === 100;

  return (
    <div className="w-full space-y-2 mt-2">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className={isComplete ? "text-success" : "text-muted-foreground"}>
          {isComplete ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Ficha Completa
            </span>
          ) : (
            "Completar Ficha"
          )}
        </span>
        <span className={progress < 50 ? "text-destructive" : progress < 100 ? "text-warning" : "text-success"}>
          {progress}%
        </span>
      </div>
      <Progress value={progress} className="h-1.5" />
      {progress < 100 && (
        <p className="text-[9px] text-muted-foreground italic">
          {progress < 60 ? "Faltam dados essenciais (CPF/Foto)" : "Quase lá! Falta pouco para 100%"}
        </p>
      )}
    </div>
  );
};
