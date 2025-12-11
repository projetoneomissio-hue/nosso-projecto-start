import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Building2, Users, CheckCircle2, ArrowRight } from "lucide-react";

const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const totalSteps = 3;
    const progress = (step / totalSteps) * 100;

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            navigate("/dashboard");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            {/* Progress Bar */}
            <div className="w-full max-w-md mb-8 space-y-2">
                <div className="flex justify-between text-sm font-medium text-slate-600">
                    <span>Configuração Inicial</span>
                    <span>Passo {step} de {totalSteps}</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            <Card className="w-full max-w-md shadow-soft border-none">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        {step === 1 && "Bem-vindo ao Zafen! 👋"}
                        {step === 2 && "Dados da Escola 🏫"}
                        {step === 3 && "Tudo Pronto! 🚀"}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {step === 1 && "Vamos configurar seu ambiente em menos de 2 minutos."}
                        {step === 2 && "Precisamos de alguns detalhes para personalizar seu painel."}
                        {step === 3 && "Seu ambiente foi configurado com sucesso."}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="space-y-4">
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="bg-primary/5 p-4 rounded-lg flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                                    <div className="text-sm text-slate-700">
                                        <p className="font-medium text-primary mb-1">Você terá acesso a:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Gestão completa de alunos</li>
                                            <li>Controle financeiro automatizado</li>
                                            <li>Portal do Responsável</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="schoolName">Nome da Instituição</Label>
                                    <Input id="schoolName" placeholder="Ex: Escola Girassol" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                                    <Input id="phone" placeholder="(11) 99999-9999" />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center space-y-6 py-4">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <p className="text-slate-600">
                                    Já criamos seu usuário administrativo e um exemplo de turma para você testar.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex justify-between">
                    {step > 1 ? (
                        <Button variant="ghost" onClick={() => setStep(step - 1)}>Voltar</Button>
                    ) : (
                        <div /> // Spacer
                    )}

                    <Button onClick={handleNext} className="gap-2">
                        {step === totalSteps ? "Ir para Dashboard" : "Continuar"}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </CardFooter>
            </Card>

            <p className="mt-8 text-center text-sm text-slate-400">
                Zafen &copy; 2025
            </p>
        </div>
    );
};

export default Onboarding;
