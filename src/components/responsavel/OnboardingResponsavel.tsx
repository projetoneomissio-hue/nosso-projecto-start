import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAlunoMutations } from "@/hooks/useAlunos";
import { Loader2, UserPlus, ArrowRight, CheckCircle2, School } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCPF, unmaskCPF, validateCPF } from "@/utils/cpf";

export const OnboardingResponsavel = () => {
    const { user } = useAuth();
    const { saveMutation } = useAlunoMutations();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        nome: "",
        data_nascimento: "",
        cpf: "",
        telefone: "",
        responsavel_id: user?.id
    });

    const [cpfError, setCpfError] = useState<string | null>(null);

    const handleCpfChange = (value: string) => {
        const formatted = formatCPF(value);
        setFormData({ ...formData, cpf: formatted });
        setCpfError(null);

        const clean = unmaskCPF(formatted);
        if (clean.length === 11 && !validateCPF(clean)) {
            setCpfError("CPF inválido");
        }
    };

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = async () => {
        if (cpfError) return;

        try {
            await saveMutation.mutateAsync({ data: formData });
            setStep(3); // Success step
        } catch (error) {
            console.error("Erro ao salvar aluno:", error);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-xl border-primary/10">
                {step === 1 && (
                    <>
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                                <School className="w-10 h-10 text-primary" />
                            </div>
                            <CardTitle className="text-2xl">Bem-vindo ao Portal do Responsável!</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Ficamos felizes em ter você aqui. Para começar a usar o sistema e matricular seus filhos nas atividades, precisamos de alguns dados iniciais.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg flex gap-3 text-sm">
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                <p>Acompanhe a frequência e desenvolvimento.</p>
                            </div>
                            <div className="bg-muted p-4 rounded-lg flex gap-3 text-sm">
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                <p>Realize pagamentos e emita recibos facilmente.</p>
                            </div>
                            <div className="bg-muted p-4 rounded-lg flex gap-3 text-sm">
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                <p>Matricule em novas atividades em poucos cliques.</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleNext} className="w-full gap-2 text-lg h-12">
                                Começar <ArrowRight className="w-5 h-5" />
                            </Button>
                        </CardFooter>
                    </>
                )}

                {step === 2 && (
                    <>
                        <CardHeader>
                            <CardTitle>Cadastrar Primeiro Aluno</CardTitle>
                            <CardDescription>
                                Informe os dados do seu filho(a) ou dependente para prosseguir.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome Completo</Label>
                                <Input
                                    id="nome"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Nome do aluno"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nascimento">Data de Nascimento</Label>
                                    <Input
                                        id="nascimento"
                                        type="date"
                                        value={formData.data_nascimento}
                                        onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cpf">CPF (Opcional)</Label>
                                    <Input
                                        id="cpf"
                                        value={formData.cpf}
                                        onChange={(e) => handleCpfChange(e.target.value)}
                                        placeholder="000.000.000-00"
                                    />
                                    {cpfError && <p className="text-xs text-red-500">{cpfError}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="telefone">Telefone de Contato</Label>
                                <Input
                                    id="telefone"
                                    value={formData.telefone}
                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="ghost" onClick={handleBack}>Voltar</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!formData.nome || !formData.data_nascimento || saveMutation.isPending}
                                className="gap-2"
                            >
                                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                Cadastrar Aluno
                            </Button>
                        </CardFooter>
                    </>
                )}

                {step === 3 && (
                    <>
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-green-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl">Tudo Pronto!</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Aluno cadastrado com sucesso. Agora você já pode solicitar matrículas nas atividades disponíveis.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-muted rounded-lg text-center">
                                <p className="font-medium">{formData.nome}</p>
                                <p className="text-sm text-muted-foreground">Cadastrado com sucesso</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                            <Button onClick={() => window.location.reload()} className="w-full h-12 text-lg">
                                Ir para o Dashboard
                            </Button>
                            <Button variant="outline" onClick={() => navigate("/responsavel/nova-matricula")} className="w-full">
                                Solicitar Matrícula Agora
                            </Button>
                        </CardFooter>
                    </>
                )}
            </Card>

            {/* Background decoration */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        </div>
    );
};
