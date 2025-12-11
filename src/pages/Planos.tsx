import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const Planos = () => {
    const [isAnnual, setIsAnnual] = useState(false);

    // Pricing Data
    const plans = [
        {
            name: "Starter",
            description: "Ideal para escolas que estão começando e querem organização.",
            price: isAnnual ? 79 : 97,
            popular: false,
            features: [
                "Até 50 alunos",
                "1 Usuário Administrativo",
                "Gestão básica de matrículas",
                "Dashboard do Responsável",
                "Suporte por Email",
            ],
            notIncluded: [
                "Gestão Financeira Completa",
                "Múltiplos Usuários",
                "API & Integrações",
            ],
            cta: "Começar Grátis",
            ctaLink: "/register?plan=starter",
            variant: "outline" as const,
        },
        {
            name: "Pro",
            description: "A escolha certa para escolas em crescimento que precisam de controle total.",
            price: isAnnual ? 159 : 197,
            popular: true,
            features: [
                "Até 300 alunos",
                "5 Usuários Administrativos",
                "Gestão Financeira & Cobrança Auto",
                "App dos Pais (PWA)",
                "Relatórios Pedagógicos Avançados",
                "Suporte Prioritário (WhatsApp)",
                "Disparo de Comunicados",
            ],
            notIncluded: [
                "Integração API Personalizada",
            ],
            cta: "Testar por 14 dias",
            ctaLink: `/checkout?plan=pro&billing=${isAnnual ? 'annual' : 'monthly'}`,
            variant: "default" as const,
        },
        {
            name: "Enterprise",
            description: "Para redes de ensino e grandes instituições com necessidades específicas.",
            price: "Sob Consulta",
            popular: false,
            features: [
                "Alunos Ilimitados",
                "Usuários Ilimitados",
                "Múltiplas Unidades Centralizadas",
                "API Dedicada & Webhooks",
                "Consultoria de Implantação",
                "Contrato SLA & LGPD Custom",
            ],
            notIncluded: [],
            cta: "Falar com Consultor",
            ctaLink: "/contato",
            variant: "outline" as const,
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 font-sans">
            {/* Header */}
            <div className="container mx-auto px-4 pt-20 pb-10 text-center">
                <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-default" variant="secondary">
                    Novos Planos 2025 🚀
                </Badge>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
                    Preços simples,<br /> <span className="text-primary">resultados gigantes.</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
                    Escolha o plano ideal para modernizar sua gestão escolar. Teste grátis por 14 dias independente do plano.
                </p>

                {/* Toggle Annual/Monthly */}
                <div className="flex items-center justify-center gap-4 mb-12">
                    <span className={cn("text-sm font-medium transition-colors", !isAnnual ? "text-slate-900" : "text-slate-500")}>
                        Mensal
                    </span>
                    <Switch
                        checked={isAnnual}
                        onCheckedChange={setIsAnnual}
                        className="data-[state=checked]:bg-primary"
                    />
                    <span className={cn("text-sm font-medium transition-colors", isAnnual ? "text-slate-900" : "text-slate-500")}>
                        Anual <span className="text-green-600 font-bold ml-1">(-20%)</span>
                    </span>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="container mx-auto px-4 pb-24">
                <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map((plan) => (
                        <Card
                            key={plan.name}
                            className={cn(
                                "relative flex flex-col transition-all duration-300 hover:shadow-xl border-2",
                                plan.popular
                                    ? "border-primary shadow-soft scale-105 z-10"
                                    : "border-slate-100 hover:border-slate-300 shadow-sm"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm">
                                        Mais Popular
                                    </Badge>
                                </div>
                            )}

                            <CardHeader>
                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                <CardDescription className="text-slate-500 mt-2 h-12">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <div className="mb-8">
                                    <span className="text-4xl font-bold tracking-tight">
                                        {typeof plan.price === 'number' ? `R$ ${plan.price}` : plan.price}
                                    </span>
                                    {typeof plan.price === 'number' && (
                                        <span className="text-slate-500 ml-2">/mês</span>
                                    )}
                                    {isAnnual && typeof plan.price === 'number' && (
                                        <p className="text-sm text-green-600 font-semibold mt-1">Cobrado anualmente</p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3">
                                            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                <Check className="h-4 w-4 text-green-600" />
                                            </div>
                                            <span className="text-sm text-slate-700">{feature}</span>
                                        </div>
                                    ))}
                                    {plan.notIncluded.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3 opacity-50">
                                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                <X className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <span className="text-sm text-slate-500 line-through decoration-slate-400/50">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>

                            <CardFooter className="pt-8">
                                <Button
                                    asChild
                                    className={cn("w-full h-12 text-base", plan.popular ? "bg-primary hover:bg-primary/90" : "")}
                                    variant={plan.variant}
                                >
                                    <Link to={plan.ctaLink}>
                                        {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* FAQ Section (Breve) */}
                <div className="max-w-3xl mx-auto mt-20 text-center">
                    <h3 className="text-2xl font-bold mb-8">Dúvidas Frequentes</h3>
                    <div className="space-y-6 text-left">
                        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <h4 className="font-semibold text-lg mb-2 flex items-center"><HelpCircle className="w-5 h-5 mr-2 text-primary" /> Consigo mudar de plano depois?</h4>
                            <p className="text-slate-600">Com certeza! Você pode fazer upgrade ou downgrade a qualquer momento direto pelo painel de controle.</p>
                        </div>
                        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <h4 className="font-semibold text-lg mb-2 flex items-center"><HelpCircle className="w-5 h-5 mr-2 text-primary" /> Preciso cadastrar cartão para testar?</h4>
                            <p className="text-slate-600">Não. O período de teste de 14 dias é totalmente gratuito e sem compromisso. Só pedimos os dados de pagamento se você decidir continuar.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Planos;
