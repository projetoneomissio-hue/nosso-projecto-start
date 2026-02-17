import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Users, Activity } from "lucide-react";
import therapyImage from "@/assets/therapy-counseling.jpg";

export const TherapySection = () => {
    return (
        <section id="terapia" className="py-20 scroll-mt-20">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <div className="aspect-video rounded-2xl overflow-hidden shadow-xl border border-border">
                            <img
                                src={therapyImage}
                                alt="Sessão de aconselhamento terapêutico"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <div className="space-y-6 order-1 lg:order-2">
                        <Badge variant="outline" className="w-fit">Saúde Mental</Badge>
                        <h2 className="text-4xl font-bold">
                            Aconselhamento Terapêutico
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Além das atividades esportivas e educacionais, o Centro Social Neo Missio oferece
                            serviços de aconselhamento terapêutico para apoio emocional e desenvolvimento pessoal.
                        </p>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Heart className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Atendimento Individual</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Sessões personalizadas para trabalhar questões específicas e promover bem-estar emocional.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Orientação Familiar</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Apoio para fortalecer vínculos familiares e construir ambientes saudáveis.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Activity className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Desenvolvimento Pessoal</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Ferramentas para autoconhecimento, gestão emocional e crescimento pessoal.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button size="lg" className="gap-2">
                            Agendar Consulta
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};
