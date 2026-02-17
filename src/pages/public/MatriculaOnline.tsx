
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, School } from "lucide-react";
// import InputMask from "react-input-mask";

// Schema de validação simplificado (Lead Magnet)
const matriculaSchema = z.object({
    nome_completo: z.string().min(5, "Nome completo é obrigatório"),
    whatsapp: z.string().min(14, "WhatsApp incompleto"), // (00) 00000-0000
    data_nascimento: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
});

type MatriculaFormValues = z.infer<typeof matriculaSchema>;

export default function MatriculaOnline() {
    const { slug } = useParams<{ slug: string }>();
    const [unidade, setUnidade] = useState<{ id: string; nome: string; logo_url: string | null } | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const { toast } = useToast();

    const form = useForm<MatriculaFormValues>({
        resolver: zodResolver(matriculaSchema),
        defaultValues: {
            nome_completo: "",
            whatsapp: "",
            data_nascimento: "",
        },
    });

    // 1. Buscar dados da unidade pelo slug
    useEffect(() => {
        async function fetchUnidade() {
            if (!slug) return;

            const { data, error } = await supabase
                .from("unidades")
                .select("id, nome, logo_url")
                .eq("slug", slug)
                .maybeSingle();

            if (error) {
                console.error("Erro ao buscar unidade:", error);
                toast({ title: "Erro ao carregar unidade", variant: "destructive" });
            }

            setUnidade(data);
            setLoading(false);
        }

        fetchUnidade();
    }, [slug, toast]);

    // 2. Enviar solicitação
    const onSubmit = async (data: MatriculaFormValues) => {
        if (!unidade) return;

        try {
            const { error } = await supabase.from("solicitacoes_matricula").insert({
                nome_completo: data.nome_completo,
                whatsapp: data.whatsapp,
                data_nascimento: data.data_nascimento,
                unidade_id: unidade.id,
                status: "pendente",
            });

            if (error) throw error;

            setSubmitted(true);
        } catch (error) {
            console.error(error);
            toast({ title: "Erro ao enviar matrícula", description: "Tente novamente mais tarde.", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!unidade) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <School className="h-16 w-16 text-gray-300 mb-4" />
                <h1 className="text-xl font-bold text-gray-900">Unidade não encontrada</h1>
                <p className="text-gray-500">Verifique o link ou entre em contato com a instituição.</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary/5 p-4">
                <Card className="w-full max-w-md text-center p-6">
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl mb-2">Solicitação Recebida!</CardTitle>
                    <CardDescription className="text-lg">
                        Muito obrigado, <strong>{form.getValues("nome_completo").split(" ")[0]}</strong>.
                        <br /><br />
                        A coordenação da unidade <strong>{unidade.nome}</strong> recebeu seus dados e entrará em contato pelo WhatsApp em breve.
                    </CardDescription>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="mb-8 text-center">
                {unidade.logo_url && (
                    <img src={unidade.logo_url} alt={unidade.nome} className="h-16 mx-auto mb-4 object-contain" />
                )}
                <h1 className="text-3xl font-bold text-gray-900">Matrícula Online</h1>
                <p className="text-lg text-gray-600 mt-1">{unidade.nome}</p>
            </div>

            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle>Garanta sua vaga</CardTitle>
                    <CardDescription>Preencha os dados abaixo para iniciar sua matrícula.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="nome_completo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome Completo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: João da Silva" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="whatsapp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>WhatsApp para Contato</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="(00) 00000-0000"
                                                {...field}
                                                onChange={(e) => {
                                                    // Simple mask logic
                                                    let value = e.target.value.replace(/\D/g, "");
                                                    if (value.length > 11) value = value.slice(0, 11);

                                                    // (00) 00000-0000
                                                    if (value.length > 2) {
                                                        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                                                    }
                                                    if (value.length > 9) {
                                                        value = `${value.slice(0, 9)}-${value.slice(9)}`;
                                                    }

                                                    field.onChange(value);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="data_nascimento"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data de Nascimento</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full text-lg h-12" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Enviar Solicitação
                            </Button>

                        </form>
                    </Form>
                </CardContent>
            </Card>

            <p className="mt-8 text-sm text-gray-400">
                Desenvolvido por NeoMissio
            </p>
        </div>
    );
}
