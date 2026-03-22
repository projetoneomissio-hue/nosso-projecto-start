import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ActivityItem } from "@/data/landing-data";

interface ActivitiesSectionProps {
    activities: ActivityItem[];
}

export const ActivitiesSection = ({ activities }: ActivitiesSectionProps) => {
    return (
        <section id="atividades" className="py-20 scroll-mt-20">
            <div className="container mx-auto px-4">
                <div className="text-center space-y-4 mb-16">
                    <Badge variant="outline" className="w-fit mx-auto">Nossas Atividades</Badge>
                    <h2 className="text-4xl font-bold tracking-tight">
                        Atividades para Todas as Idades
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        Confira as atividades disponíveis e garanta sua vaga. Valores acessíveis para o desenvolvimento da nossa comunidade.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activities.map((activity, index) => {
                        const Icon = activity.icon;
                        return (
                            <Card key={index} className="flex flex-col h-full overflow-hidden group hover:shadow-xl transition-all duration-500 border-border/50">
                                <div className="relative h-56 overflow-hidden">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${activity.gradient} opacity-20 group-hover:opacity-40 transition-opacity duration-500 z-10`} />
                                    <img
                                        src={activity.image}
                                        alt={activity.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm p-2.5 rounded-xl shadow-sm z-20">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="absolute bottom-4 left-4 z-20">
                                        <Badge className="bg-background/95 backdrop-blur-sm text-foreground hover:bg-background border-none shadow-sm text-sm py-1">
                                            {activity.price}
                                        </Badge>
                                    </div>
                                </div>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">{activity.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 text-sm leading-relaxed min-h-[40px]">
                                        {activity.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 flex-grow pb-6">
                                    <div className="grid grid-cols-1 gap-3 py-4 border-y border-border/50">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-2">
                                                Frequência:
                                            </span>
                                            <span className="font-semibold">{activity.frequency}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Público:</span>
                                            <span className="font-semibold">{activity.targetAudience}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="bg-muted/50 rounded-lg p-3">
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Horários</p>
                                            <p className="text-xs font-medium leading-relaxed italic">{activity.schedule}</p>
                                        </div>

                                        <Button asChild className="w-full h-12 text-base font-bold shadow-md hover:shadow-lg transition-all gap-2" size="lg">
                                            <Link to={`/matricula/matriz?atividade=${encodeURIComponent(activity.title)}`}>
                                                Quero me inscrever
                                                <ArrowRight className="h-5 w-5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-20 text-center">
                    <p className="text-muted-foreground mb-4">Dúvidas sobre as inscrições?</p>
                    <Button asChild variant="outline" className="gap-2 h-12 px-8">
                        <a href="https://wa.me/5541984406992" target="_blank" rel="noopener noreferrer">
                            Falar com a Coordenação no WhatsApp
                            <ArrowRight className="h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </div>
        </section>
    );
};
