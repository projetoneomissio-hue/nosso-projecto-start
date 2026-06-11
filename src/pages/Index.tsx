import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Users, Trophy, Sparkles, Building2,
  LayoutDashboard, CreditCard, GraduationCap,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { SeoHead } from "@/components/SeoHead";
import { useUTMTracking } from "@/hooks/useUTMTracking";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicTenant } from "@/contexts/PublicTenantContext";
import TenantLanding from "./public/TenantLanding";

const Index = () => {
  useUTMTracking();
  const { isAuthenticated } = useAuth();
  const { isCustomDomain } = usePublicTenant();

  // Domínio customizado de cliente → renderiza a landing do tenant
  if (isCustomDomain) return <TenantLanding />;

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="light min-h-screen bg-white text-gray-900">
      <SeoHead
        title="Zafen — Gestão para Organizações Sociais"
        description="Sistema completo de gestão para escolas, ONGs e organizações educacionais. Matrículas, financeiro, presença e portal do responsável em um só lugar."
      />

      {/* Nav */}
      <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-xl font-black text-primary-foreground">Z</span>
            </div>
            <span className="font-black text-xl tracking-tighter uppercase">Zafen</span>
          </div>
          <div className="flex gap-4 items-center">
            <a href="#funcionalidades" className="hidden sm:inline text-sm font-medium hover:text-primary transition-colors">
              Funcionalidades
            </a>
            <a href="#para-quem" className="hidden md:inline text-sm font-medium hover:text-primary transition-colors">
              Para quem é
            </a>
            <Button size="sm" asChild>
              <Link to="/login">Acessar Sistema</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl space-y-6">
            <Badge className="w-fit gap-1.5" variant="secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse inline-block" />
              Multi-tenant · White-label
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Gestão completa para
              <span className="text-primary"> sua organização</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Escolas, ONGs e centros educacionais. Matrículas online, controle financeiro,
              presença e portal do responsável — tudo no seu próprio domínio.
            </p>

            <div className="flex flex-wrap gap-6 pt-2">
              {[
                { icon: Users, value: "Multi-tenant", label: "cada org isolada" },
                { icon: Building2, value: "White-label", label: "seu domínio" },
                { icon: Trophy, value: "PWA", label: "funciona no celular" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-black text-foreground">{value}</span>
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/20" asChild>
                <Link to="/login">
                  Acessar Sistema
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <Link to="/org/neo-missio">Ver Demonstração</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Funcionalidades</Badge>
            <h2 className="text-3xl font-bold">Tudo que sua organização precisa</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: GraduationCap,
                title: "Matrículas Online",
                desc: "Formulário público com link direto. Aluno se cadastra e entra no sistema automaticamente.",
              },
              {
                icon: CreditCard,
                title: "Controle Financeiro",
                desc: "Mensalidades, cobranças, histórico e relatórios. Integração com gateway de pagamento.",
              },
              {
                icon: LayoutDashboard,
                title: "Multi-perfil",
                desc: "Direção, coordenação, professor, secretaria e responsável — cada um com seu painel.",
              },
              {
                icon: Sparkles,
                title: "Landing Page Inclusa",
                desc: "Cada organização tem sua própria página pública no seu domínio. Editável pelo gestor.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl bg-background border border-border/50 hover:border-primary/30 transition-colors space-y-3">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem */}
      <section id="para-quem" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Para quem é</Badge>
            <h2 className="text-3xl font-bold">Feito para organizações com propósito</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { emoji: "🏫", title: "Escolas e Cursinhos", desc: "Turmas, notas, presença e comunicados para alunos e responsáveis." },
              { emoji: "🤝", title: "ONGs e Projetos Sociais", desc: "Gestão de beneficiários, voluntários e relatórios de impacto." },
              { emoji: "🏃", title: "Centros Esportivos", desc: "Modalidades, matrículas e agenda de aulas em um só sistema." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-border/50 text-center space-y-3 hover:border-primary/30 transition-colors">
                <span className="text-4xl">{emoji}</span>
                <h3 className="font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center max-w-2xl space-y-6">
          <h2 className="text-4xl font-black">Pronto para começar?</h2>
          <p className="text-lg opacity-75">
            Entre em contato e configure sua organização. Seu sistema, no seu domínio.
          </p>
          <Button size="lg" className="gap-2" asChild>
            <Link to="/login">
              Acessar Sistema
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="py-8 border-t text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Zafen. Sistema de gestão para organizações sociais.</p>
      </footer>
    </div>
  );
};

export default Index;
