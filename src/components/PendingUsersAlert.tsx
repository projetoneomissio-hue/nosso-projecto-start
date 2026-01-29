import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PendingUsersAlertProps {
  count: number;
  role: "professor" | "coordenacao";
  linkTo?: string;
}

export const PendingUsersAlert = ({ count, role, linkTo }: PendingUsersAlertProps) => {
  if (count === 0) return null;

  const roleLabel = role === "professor" ? "professores" : "coordenadores";
  const actionLabel = role === "professor" 
    ? "vincular na lista abaixo" 
    : "atribuir atividades";

  return (
    <Alert className="border-warning/50 bg-warning/10">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning-foreground">
        {count} {count === 1 ? "usuário aguardando" : "usuários aguardando"} vinculação
      </AlertTitle>
      <AlertDescription className="text-muted-foreground">
        Existem {count} {roleLabel} cadastrados que ainda não foram vinculados. 
        Clique em "Novo {role === "professor" ? "Professor" : "Coordenador"}" para {actionLabel}.
        {linkTo && (
          <Link to={linkTo}>
            <Button variant="link" className="p-0 h-auto underline ml-1">
              Ver convites
            </Button>
          </Link>
        )}
      </AlertDescription>
    </Alert>
  );
};
