import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUltimosPagamentos } from "@/hooks/useFinanceiro";
import { generateWhatsAppLink, WhatsAppTemplates } from "@/utils/whatsapp";

export const RecentPaymentsTable = () => {
    const { data: ultimosPagamentos, isLoading } = useUltimosPagamentos(10);

    if (isLoading) {
        return (
            <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!ultimosPagamentos?.length) {
        return <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento recente encontrado.</p>;
    }

    return (
        <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
                <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Aluno</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Atividade</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Data</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Valor</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Status</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {ultimosPagamentos.map((pagamento: any) => (
                        <tr key={pagamento.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle font-medium">{pagamento.matricula?.aluno?.nome_completo || "Desconhecido"}</td>
                            <td className="p-4 align-middle">{pagamento.matricula?.turma?.atividade?.nome || "-"}</td>
                            <td className="p-4 align-middle">
                                {pagamento.data_pagamento
                                    ? new Date(pagamento.data_pagamento).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                                    : "-"}
                            </td>
                            <td className="p-4 align-middle text-right font-medium text-green-600">
                                R$ {parseFloat(pagamento.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4 align-middle text-center">
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-800 hover:bg-green-200">
                                    Pago
                                </span>
                            </td>
                            <td className="p-4 align-middle text-right">
                                {pagamento.matricula?.aluno?.responsavel?.telefone && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        title="Enviar Comprovante"
                                        onClick={() => {
                                            const nomeResp = pagamento.matricula?.aluno?.responsavel?.nome_completo || "Responsável";
                                            const nomeAluno = pagamento.matricula?.aluno?.nome_completo || "Aluno";
                                            const atividade = pagamento.matricula?.turma?.atividade?.nome || "Atividade";
                                            const valor = parseFloat(pagamento.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

                                            const link = generateWhatsAppLink(
                                                pagamento.matricula.aluno.responsavel.telefone,
                                                WhatsAppTemplates.recibo(nomeResp, nomeAluno, atividade, valor)
                                            );
                                            window.open(link, "_blank");
                                        }}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
