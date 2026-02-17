import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import logoNeoMissio from "@/assets/logo-neo-missio.png";

export const LandingFooter = () => {
    return (
        <>
            {/* CTA Section */}
            <section className="py-20 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-4xl font-bold mb-4">
                            Faça Parte da Nossa Comunidade
                        </h2>
                        <p className="text-lg mb-8 opacity-90">
                            Junte-se a centenas de pessoas que já transformaram suas vidas através das
                            atividades e serviços do Centro Social Neo Missio.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Button asChild size="lg" variant="secondary" className="gap-2">
                                <a href="https://forms.gle/oKs6ari7ChgxobAQ9" target="_blank" rel="noopener noreferrer">
                                    Inscrever-se Agora
                                    <ArrowRight className="h-5 w-5" />
                                </a>
                            </Button>
                            <Link to="/login">
                                <Button size="lg" variant="outline" className="gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground text-primary-foreground">
                                    Acessar Sistema
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-muted/30 py-12">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div>
                            <img src={logoNeoMissio} alt="Neo Missio" className="h-12 w-auto mb-4" />
                            <p className="text-sm text-muted-foreground">
                                Transformando vidas através da educação, esporte e cultura desde 2020.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Links Rápidos</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#atividades" className="text-muted-foreground hover:text-primary transition-colors">Atividades</a></li>
                                <li><a href="#depoimentos" className="text-muted-foreground hover:text-primary transition-colors">Depoimentos</a></li>
                                <li><a href="#terapia" className="text-muted-foreground hover:text-primary transition-colors">Aconselhamento</a></li>
                                <li><Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">Sistema</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Contato</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>Rua Camilo Castelo Branco, 523</li>
                                <li>Vila Lindóia</li>
                                <li>WhatsApp: (41) 98440-6992</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                        <p>&copy; {new Date().getFullYear()} Neo Missio. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer>
        </>
    );
};
