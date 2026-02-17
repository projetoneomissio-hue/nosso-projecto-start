import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Heart, Users, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { SeoHead } from "@/components/SeoHead";
import { useUTMTracking } from "@/hooks/useUTMTracking";
import { activities, testimonials } from "@/data/landing-data";
import { ActivitiesSection } from "@/components/landing/ActivitiesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { TherapySection } from "@/components/landing/TherapySection";
import { LandingFooter } from "@/components/landing/LandingFooter";

import logoNeoMissio from "@/assets/logo-neo-missio.png";
import heroImage from "@/assets/hero-neo-missio.jpg";

const Index = () => {
  useUTMTracking();

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Atividades Extracurriculares"
        description="Ballet, Jiu-Jitsu, Música, Inglês e muito mais. Transformando vidas através da educação, esporte e cultura em Curitiba."
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <img src={logoNeoMissio} alt="Neo Missio" className="h-12 w-auto" />
          <div className="flex gap-4 items-center">
            <a href="#atividades" className="text-sm font-medium hover:text-primary transition-colors">
              Atividades
            </a>
            <a href="#depoimentos" className="text-sm font-medium hover:text-primary transition-colors">
              Depoimentos
            </a>
            <a href="#terapia" className="text-sm font-medium hover:text-primary transition-colors">
              Aconselhamento
            </a>
            <Link to="/login">
              <Button size="sm">Acessar Sistema</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="w-fit" variant="secondary">
                Centro Social Comunitário
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Atividades 2026
                <span className="text-primary"> - Inscreva-se!</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Confira nossas atividades e se inscreva! Algumas atividades estarão em lista de espera.
                Após a inscrição, nos chame no WhatsApp para darmos continuidade na sua matrícula.
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
                <p className="text-sm font-semibold">
                  Taxa de matrícula: <span className="text-primary text-lg">R$ 25,00</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <a href="#atividades">
                  <Button size="lg" className="gap-2">
                    Conheça as Atividades
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </a>
                <a href="#terapia">
                  <Button size="lg" variant="outline" className="gap-2">
                    Aconselhamento Terapêutico
                  </Button>
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border">
                <img
                  src={heroImage}
                  alt="Crianças e adultos em atividades do Centro Social Neo Missio"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <Heart className="h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">11</p>
                    <p className="text-sm">Atividades Disponíveis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="w-fit mx-auto">Sobre o Projeto</Badge>
            <h2 className="text-4xl font-bold">
              Missão de Transformação Social
            </h2>
            <p className="text-lg text-muted-foreground">
              O Centro Social Neo Missio nasceu com o propósito de oferecer oportunidades de desenvolvimento
              para comunidades em situação de vulnerabilidade. Através de atividades esportivas, educacionais
              e terapêuticas, promovemos inclusão social, saúde física e mental, e construção de valores como
              disciplina, respeito e trabalho em equipe.
            </p>
            <div className="grid md:grid-cols-3 gap-8 pt-8">
              <div className="space-y-2">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Inclusão</h3>
                <p className="text-sm text-muted-foreground">
                  Atendemos todas as faixas etárias e origens socioeconômicas
                </p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Desenvolvimento</h3>
                <p className="text-sm text-muted-foreground">
                  Foco no crescimento integral: corpo, mente e caráter
                </p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Comunidade</h3>
                <p className="text-sm text-muted-foreground">
                  Criamos laços e transformamos vidas juntos
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ActivitiesSection activities={activities} />
      <TestimonialsSection testimonials={testimonials} />
      <TherapySection />
      <LandingFooter />
    </div>
  );
};

export default Index;
