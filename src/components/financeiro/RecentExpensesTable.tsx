import { Loader2 } from "lucide-react";
import { useCustosRecentes } from "@/hooks/useFinanceiro";
import { format } from "date-fns";

export const RecentExpensesTable = () => {
    const { data: ultimasDespesas, isLoading } = useCustosRecentes(10);

    if (isLoading) {
        return (
            <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!ultimasDespesas?.length) {
        return <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa registrada.</p>;
    }

    return (
        <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
                <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Descrição</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Categoria</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Data</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Valor</th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {ultimasDespesas.map((despesa: any) => (
                        <tr key={despesa.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle font-medium">{despesa.item}</td>
                            <td className="p-4 align-middle">{despesa.tipo}</td>
                            <td className="p-4 align-middle">
                                {format(new Date(despesa.data_competencia), "dd/MM/yyyy")}
                            </td>
                            <td className="p-4 align-middle text-right font-medium text-destructive">
                                - R$ {parseFloat(despesa.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
