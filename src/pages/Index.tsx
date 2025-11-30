import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Heart, Users, Trophy, Music, BookOpen, Activity, Sparkles, Quote, Palette } from "lucide-react";
import { Link } from "react-router-dom";

import logoNeoMissio from "@/assets/logo-neo-missio.png";
import heroImage from "@/assets/hero-neo-missio.jpg";
import jiujitsuImage from "@/assets/jiujitsu-activity.jpg";
import musicImage from "@/assets/music-activity.jpg";
import educationImage from "@/assets/education-activity.jpg";
import pilatesImage from "@/assets/pilates-activity.jpg";
import volleyballImage from "@/assets/volleyball-activity.jpg";
import balletImage from "@/assets/ballet-activity.jpg";
import therapyImage from "@/assets/therapy-counseling.jpg";
import drawingImage from "@/assets/drawing-activity.jpg";
import testimonialMaria from "@/assets/testimonial-maria.jpg";
import testimonialLucas from "@/assets/testimonial-lucas.jpg";
import testimonialCarlos from "@/assets/testimonial-carlos.jpg";

const Index = () => {
  const activities = [
    {
      title: "Reforço Escolar",
      description: "Apoio educacional para crianças de 1 a 9 anos, focado em alfabetização e desenvolvimento acadêmico.",
      price: "R$ 40,00",
      frequency: "1x por semana",
      schedule: "Segunda a Quinta-feira",
      targetAudience: "Crianças de 1 a 9 anos - Apenas alunos de escola pública",
      image: educationImage,
      icon: BookOpen,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Jiu-Jitsu",
      description: "Artes marciais para desenvolvimento de disciplina, respeito e condicionamento físico.",
      price: "R$ 90,00 (Adulto) / R$ 50,00 (Infantil)",
      frequency: "2x por semana",
      schedule: "Terça e Quinta-feira",
      targetAudience: "Crianças a partir de 4 anos e adultos acima de 11 anos",
      image: jiujitsuImage,
      icon: Trophy,
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: "Aulas de Música",
      description: "Teclado e Violão para despertar o talento musical e expressão artística.",
      price: "R$ 90,00",
      frequency: "1x por semana",
      schedule: "Sábados (horários variados)",
      targetAudience: "Crianças alfabetizadas e adultos",
      image: musicImage,
      icon: Music,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "Aulas de Desenho",
      description: "Expressão artística e desenvolvimento da criatividade através do desenho.",
      price: "R$ 60,00",
      frequency: "1x por semana",
      schedule: "Sábados",
      targetAudience: "Crianças e adolescentes",
      image: drawingImage,
      icon: Palette,
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      title: "Pilates Solo",
      description: "Exercícios de baixo impacto para fortalecimento, flexibilidade e bem-estar.",
      price: "R$ 90,00",
      frequency: "2x por semana",
      schedule: "Terça e Quinta-feira",
      targetAudience: "Exclusivo para mulheres",
      image: pilatesImage,
      icon: Activity,
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Vôlei",
      description: "Esporte coletivo desenvolvendo trabalho em equipe, coordenação motora e saúde.",
      price: "R$ 50,00",
      frequency: "Sábados",
      schedule: "Horários variados por categoria",
      targetAudience: "Crianças de 8 a 14 anos e adultos (turmas mistas)",
      image: volleyballImage,
      icon: Users,
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      title: "Ballet Infantil",
      description: "Dança clássica para desenvolvimento da expressão corporal, postura e graciosidade.",
      price: "R$ 60,00",
      frequency: "Sábados",
      schedule: "Horários por faixa etária",
      targetAudience: "Crianças de 4 a 10 anos",
      image: balletImage,
      icon: Sparkles,
      gradient: "from-pink-500 to-rose-500"
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Mãe da Júlia",
      photo: testimonialMaria,
      feedback: "O Neo Missio transformou a vida da minha filha. Ela melhorou muito na escola com o reforço escolar e adora as aulas de ballet. Agradeço imensamente todo o trabalho da equipe!"
    },
    {
      name: "Lucas Ferreira",
      role: "Aluno de Jiu-Jitsu",
      photo: testimonialLucas,
      feedback: "Comecei no Jiu-Jitsu há 2 anos e minha vida mudou completamente. Aprendi disciplina, respeito e fiz grandes amigos. O projeto social é incrível!"
    },
    {
      name: "Carlos Roberto",
      role: "Pai do Pedro",
      photo: testimonialCarlos,
      feedback: "Meu filho participa do vôlei e das aulas de desenho. Ver ele feliz e desenvolvendo suas habilidades não tem preço. O Neo Missio é uma bênção para nossa comunidade!"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
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
                Transformando Vidas Através da
                <span className="text-primary"> Educação e Esporte</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                O Centro Social Neo Missio oferece atividades esportivas, educacionais e terapêuticas 
                para crianças, jovens e adultos. Promovendo desenvolvimento integral, saúde e inclusão social.
              </p>
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
                    <p className="text-2xl font-bold">7+</p>
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

      {/* Activities Section */}
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
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Público:</span> {activity.targetAudience}
                      </p>
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
                <p className="text-muted-foreground mb-6">
                  Para se inscrever nas atividades, acesse o formulário de matrícula através do link abaixo. 
                  As vagas são limitadas e preenchidas por ordem de chegada.
                </p>
                <Button asChild size="lg" className="gap-2">
                  <a href="https://forms.gle/oKs6ari7ChgxobAQ9" target="_blank" rel="noopener noreferrer">
                    Realizar Inscrição
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-20 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="w-fit mx-auto mb-4">Depoimentos</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">O Que Dizem Sobre Nós</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Depoimentos de alunos, responsáveis e famílias que fazem parte da nossa comunidade
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-xl">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-4 border-primary">
                      <img 
                        src={testimonial.photo} 
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Quote className="absolute -top-2 -right-2 h-8 w-8 text-primary/20" />
                  </div>
                  <CardTitle className="text-xl">{testimonial.name}</CardTitle>
                  <CardDescription className="text-sm font-medium text-primary">
                    {testimonial.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center italic leading-relaxed">
                    "{testimonial.feedback}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Therapy Section */}
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
              <p className="text-sm text-muted-foreground">
                Entre em contato conosco para mais informações sobre as atividades e matrículas.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Neo Missio. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
