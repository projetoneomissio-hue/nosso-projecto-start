import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ActivityItem } from "@/data/landing-data";

interface ActivitiesSectionProps {
    activities: ActivityItem[];
}

export const ActivitiesSection = ({ activities }: ActivitiesSectionProps) => {
    return (
        <section id="atividades" className="py-20 scroll-mt-20">
            <div className="container mx-auto px-4">
                <div className="text-center space-y-4 mb-12">
                    <Badge variant="outline" className="w-fit mx-auto">Nossas Atividades</Badge>
                    <h2 className="text-4xl font-bold">
                        Atividades para Todas as Idades
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Confira todas as atividades disponíveis no Centro Social Neo Missio.
                        Valores acessíveis e instrutores qualificados para seu desenvolvimento.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activities.map((activity, index) => {
                        const Icon = activity.icon;
                        return (
                            <Card key={index} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                                <div className="relative h-48 overflow-hidden">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${activity.gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />
                                    <img
                                        src={activity.image}
                                        alt={activity.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm p-2 rounded-lg">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-xl">{activity.title}</CardTitle>
                                        <Badge variant="secondary" className="ml-2 shrink-0">
                                            {activity.price}
                                        </Badge>
                                    </div>
                                    <CardDescription className="line-clamp-2">
                                        {activity.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Frequência:</span>
                                            <span className="font-medium">{activity.frequency}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Horário:</span>
                                            <span className="font-medium text-right text-xs">{activity.schedule}</span>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-border space-y-1">
                                        <p className="text-xs text-muted-foreground">
                                            <span className="font-medium text-foreground">Público:</span> {activity.targetAudience}
                                        </p>
                                        {activity.note && (
                                            <p className="text-xs text-muted-foreground italic">
                                                {activity.note}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-12 text-center">
                    <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
                        <CardContent className="p-8">
                            <h3 className="text-2xl font-bold mb-4">
                                Informações para Inscrição
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Para se inscrever nas atividades, acesse o formulário de matrícula através do link abaixo.
                                As vagas são limitadas e preenchidas por ordem de chegada.
                            </p>
                            <p className="text-sm text-muted-foreground mb-6">
                                <span className="font-semibold">Observação:</span> Algumas atividades estarão em lista de espera.
                                Após a inscrição, nos chame no WhatsApp para darmos continuidade na sua matrícula.
                            </p>
                            <div className="flex flex-col gap-4">
                                <Button asChild size="lg" className="gap-2">
                                    <a href="https://forms.gle/oKs6ari7ChgxobAQ9" target="_blank" rel="noopener noreferrer">
                                        Realizar Inscrição
                                        <ArrowRight className="h-5 w-5" />
                                    </a>
                                </Button>
                                <Button asChild size="lg" variant="outline" className="gap-2">
                                    <a href="https://wa.me/5541984406992" target="_blank" rel="noopener noreferrer">
                                        Contato WhatsApp
                                        <ArrowRight className="h-5 w-5" />
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
};
