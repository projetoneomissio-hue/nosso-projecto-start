import { useState } from "react";
import { Loader2, Send, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useInadimplentes } from "@/hooks/useFinanceiro";
import { supabase } from "@/integrations/supabase/client";
import { generateWhatsAppLink, WhatsAppTemplates } from "@/utils/whatsapp";
import { asaasService } from "@/services/asaas.service";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const InadimplenciaTable = () => {
    const { toast } = useToast();
    const [sendingEmail, setSendingEmail] = useState<string | null>(null);
    const [generatingCharge, setGeneratingCharge] = useState<string | null>(null);
    const { data: inadimplentes, isLoading } = useInadimplentes();

    const handleGenerateCharge = async (pagamento: any) => {
        try {
            setGeneratingCharge(pagamento.id);

            const result = await asaasService.createCharge({
                aluno_id: pagamento.matricula?.aluno?.id,
                valor: parseFloat(pagamento.valor),
                vencimento: pagamento.data_vencimento, // Ou data de hoje para já vencer
                forma_pagamento: "PIX", // Default Pix+Boleto
                external_id: pagamento.id
            });

            if (result.success) {
                // Atualiza localmente ou refetch - Idealmente invalidar query
                toast({
                    title: "Cobrança Gerada!",
                    description: "O link foi criado e salvo no pagamento.",
                });
                // Recarregar página ou query para mostrar o link novo (simples reload por enquanto)
                window.location.reload();
            }

        } catch (error: any) {
            console.error("Erro ao gerar cobrança:", error);
            toast({
                title: "Erro ao gerar",
                description: error.message || "Falha na comunicação com Asaas.",
                variant: "destructive",
            });
        } finally {
            setGeneratingCharge(null);
        }
    };

    const handleSendReminder = async (pagamento: any) => {
        try {
            setSendingEmail(pagamento.id);

            const emailResponsavel = pagamento.matricula?.aluno?.responsavel?.email;

            if (!emailResponsavel) {
                toast({
                    title: "Email não encontrado",
                    description: "O responsável não possui email cadastrado.",
                    variant: "destructive",
                });
                return;
            }

            const hoje = new Date();
            const vencimento = new Date(pagamento.data_vencimento);
            const diffTime = Math.abs(hoje.getTime() - vencimento.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const { error } = await supabase.functions.invoke("send-payment-reminder", {
                body: {
                    to: emailResponsavel,
                    responsavelNome: pagamento.matricula?.aluno?.responsavel?.nome_completo || "Responsável",
                    alunoNome: pagamento.matricula?.aluno?.nome_completo || "Aluno",
                    atividadeNome: pagamento.matricula?.turma?.atividade?.nome || "Atividade",
                    turmaNome: pagamento.matricula?.turma?.nome || "Turma",
                    valorDevido: parseFloat(pagamento.valor),
                    diasAtraso: diffDays,
                    dataVencimento: new Date(pagamento.data_vencimento).toLocaleDateString("pt-BR"),
                },
            });

            if (error) throw error;

            toast({
                title: "Lembrete enviado!",
                description: `Email enviado para ${pagamento.matricula?.aluno?.responsavel?.nome_completo}.`,
            });

        } catch (error: any) {
            console.error("Erro ao enviar lembrete:", error);
            toast({
                title: "Erro ao enviar",
                description: "Não foi possível enviar o lembrete. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setSendingEmail(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!inadimplentes?.length) {
        return <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento em atraso.</p>;
    }

    return (
        <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
                <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Responsável / Aluno</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Vencimento</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Valor</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ação</th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {inadimplentes.map((pagamento: any) => (
                        <tr key={pagamento.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle">
                                <div className="flex flex-col">
                                    <span className="font-medium">{pagamento.matricula?.aluno?.responsavel?.nome_completo || "Sem Responsável"}</span>
                                    <span className="text-xs text-muted-foreground">Aluno: {pagamento.matricula?.aluno?.nome_completo}</span>
                                    {pagamento.gateway_url && (
                                        <a href={pagamento.gateway_url} target="_blank" className="text-xs text-blue-500 underline mt-1">
                                            Ver Boleto/Pix
                                        </a>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 align-middle text-destructive font-medium">
                                {new Date(pagamento.data_vencimento).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="p-4 align-middle text-right font-medium">
                                R$ {parseFloat(pagamento.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4 align-middle text-right flex justify-end gap-2">
                                {/* Botão Gerar Cobrança (Asaas) */}
                                {!pagamento.gateway_url && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                disabled={generatingCharge === pagamento.id}
                                            >
                                                {generatingCharge === pagamento.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <QrCode className="h-3 w-3" />}
                                                Gerar Boleto
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Gerar Cobrança Asaas?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Isso criará uma cobrança oficial (Boleto + Pix) no Asaas para o aluno.
                                                    O valor será de <strong>R$ {parseFloat(pagamento.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleGenerateCharge(pagamento)}>
                                                    Confirmar e Gerar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleSendReminder(pagamento)}
                                    disabled={sendingEmail === pagamento.id}
                                >
                                    {sendingEmail === pagamento.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Send className="h-3 w-3" />
                                    )}
                                    Lembrete
                                </Button>
                                {pagamento.matricula?.aluno?.responsavel?.telefone && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        title="Cobrar no WhatsApp"
                                        onClick={() => {
                                            const nomeResp = pagamento.matricula?.aluno?.responsavel?.nome_completo || "Responsável";
                                            const nomeAluno = pagamento.matricula?.aluno?.nome_completo || "Aluno";
                                            const dataVencimento = new Date(pagamento.data_vencimento);
                                            const mesRef = dataVencimento.toLocaleDateString("pt-BR", { month: 'long' });
                                            const valor = parseFloat(pagamento.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
                                            const linkBoleto = pagamento.gateway_url ? `\n\nLink para pagamento: ${pagamento.gateway_url}` : "";

                                            const link = generateWhatsAppLink(
                                                pagamento.matricula.aluno.responsavel.telefone,
                                                WhatsAppTemplates.cobranca(nomeResp, nomeAluno, mesRef, valor) + linkBoleto
                                            );
                                            window.open(link, "_blank");
                                        }}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-message-circle"
                                        >
                                            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                                        </svg>
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

