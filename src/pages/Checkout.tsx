import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, CreditCard, CheckCircle2, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Checkout = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const planName = searchParams.get("plan") || "Pro";
    const isAnnual = searchParams.get("billing") === "annual";

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Mock Price
    const price = planName === "Starter" ? 97 : planName === "Pro" ? 197 : 0;
    const finalPrice = isAnnual ? price * 12 * 0.8 : price;

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);

            // Redirect after success animation
            setTimeout(() => {
                navigate("/onboarding");
            }, 1500);
        }, 2000);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center p-8 animate-in zoom-in duration-300 border-none shadow-soft">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagamento Confirmado!</h2>
                    <p className="text-slate-600 mb-6">
                        Sua assinatura do plano <strong>{planName}</strong> foi ativada com sucesso.
                    </p>
                    <div className="flex justify-center">
                        <Loader2 className="animate-spin text-primary" />
                        <span className="ml-2 text-sm text-slate-500">Redirecionando para configuração...</span>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 lg:flex">
            {/* Resumo do Pedido (Desktop Left) */}
            <div className="lg:w-1/2 bg-slate-900 text-slate-50 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 max-w-md mx-auto w-full">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">Z</span>
                            Zafen
                        </h1>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-slate-400 text-sm uppercase tracking-wider font-medium mb-2">Você está assinando</p>
                            <h2 className="text-3xl font-bold">Plano {planName}</h2>
                            <p className="text-primary-foreground/80 mt-1">Gestão escolar completa e ilimitada.</p>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-700/50">
                            <div className="flex justify-between items-center">
                                <span>Assinatura {isAnnual ? "Anual" : "Mensal"}</span>
                                <span className="font-medium">R$ {price.toFixed(2)} / mês</span>
                            </div>
                            {isAnnual && (
                                <div className="flex justify-between items-center text-green-400 text-sm">
                                    <span>Desconto Anual (20%)</span>
                                    <span>- R$ {((price * 12) * 0.2).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-lg font-bold pt-4 border-t border-slate-700/50">
                                <span>Total hoje</span>
                                <span>R$ {price.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="pt-8 flex items-center gap-2 text-sm text-slate-400">
                            <ShieldCheck className="w-4 h-4" />
                            Pagamento 100% seguro e criptografado.
                        </div>
                    </div>
                </div>
            </div>

            {/* Formulário de Pagamento (Desktop Right) */}
            <div className="lg:w-1/2 p-4 lg:p-12 flex items-center justify-center bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="lg:hidden text-center mb-6">
                        <h2 className="text-xl font-bold">Finalizar Assinatura</h2>
                        <p className="text-slate-500">Plano {planName}</p>
                    </div>

                    <form onSubmit={handlePayment} className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Dados do Cartão
                            </h3>

                            <div className="space-y-2">
                                <Label htmlFor="cardName">Nome no Cartão</Label>
                                <Input id="cardName" placeholder="Como impresso no cartão" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cardNumber">Número do Cartão</Label>
                                <div className="relative">
                                    <Input id="cardNumber" placeholder="0000 0000 0000 0000" maxLength={19} required />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                                        <div className="w-8 h-5 bg-slate-100 rounded border flex items-center justify-center text-[10px] font-bold text-slate-400">VISA</div>
                                        <div className="w-8 h-5 bg-slate-100 rounded border flex items-center justify-center text-[10px] font-bold text-slate-400">MC</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expiry">Validade</Label>
                                    <Input id="expiry" placeholder="MM/AA" maxLength={5} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cvc">CVC</Label>
                                    <div className="relative">
                                        <Input id="cvc" placeholder="123" maxLength={4} required />
                                        <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    Pagar e Iniciar Teste
                                </>
                            )}
                        </Button>

                        <p className="text-xs text-center text-slate-400">
                            Ao clicar no botão acima, você concorda com nossos Termos de Serviço e Política de Privacidade.
                            Você não será cobrado durante os 14 dias de teste.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
