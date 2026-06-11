import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Trophy, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicTenant, PublicTenant } from "@/contexts/PublicTenantContext";
import { SeoHead } from "@/components/SeoHead";
import { ActivitiesSection } from "@/components/landing/ActivitiesSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { activities as staticActivities, getIconByName, ActivityItem } from "@/data/landing-data";

// ── Resolução por slug (rota /org/:slug) ─────────────────────────────────────

async function fetchTenantBySlug(slug: string): Promise<PublicTenant | null> {
    const { data } = await supabase
        .from("unidades")
        .select(
            "id, nome, slug, logo_url, custom_domain, whatsapp, instagram_url, cor_primaria, email_contato, tipo_instituicao, feature_flags"
        )
        .eq("slug", slug)
        .maybeSingle();
    return data ?? null;
}

async function fetchActivities(unidadeId: string): Promise<ActivityItem[]> {
    const { data } = await supabase
        .from("landing_atividades" as any)
        .select("*")
        .eq("unidade_id", unidadeId)
        .eq("ativo", true)
        .order("ordem", { ascending: true });

    if (!data?.length) return staticActivities;

    return data.map((a: any) => ({
        id: a.id,
        title: a.titulo,
        description: a.descricao || "",
        price: a.preco || "",
        priceNote: a.preco_nota || undefined,
        frequency: a.frequencia || "",
        schedule: a.horario || "",
        targetAudience: a.publico_alvo || "",
        note: a.nota || undefined,
        image: a.imagem_url || "",
        icon: getIconByName(a.icone),
        gradient: a.gradiente || "from-blue-500 to-cyan-500",
        waitlist: a.lista_espera || false,
        free: a.gratuito || false,
    }));
}

// ── Componente ────────────────────────────────────────────────────────────────

const TenantLanding = () => {
    const { slug } = useParams<{ slug?: string }>();
    const { tenant: domainTenant, isCustomDomain, isLoading: domainLoading } = usePublicTenant();
    const { isAuthenticated } = useAuth();

    const [tenant, setTenant] = useState<PublicTenant | null>(null);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function resolve() {
            setLoading(true);

            let resolved: PublicTenant | null = null;

            if (slug) {
                // Rota /org/:slug — busca pelo slug
                resolved = await fetchTenantBySlug(slug);
            } else if (isCustomDomain && !domainLoading) {
                // Domínio customizado — já resolvido pelo PublicTenantContext
                resolved = domainTenant;
            }

            if (!resolved) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            const acts = await fetchActivities(resolved.id);
            setTenant(resolved);
            setActivities(acts);
            setLoading(false);
        }

        if (!domainLoading) resolve();
    }, [slug, domainTenant, isCustomDomain, domainLoading]);

    if (isAuthenticated) return <Navigate to="/dashboard" replace />;

    if (loading || domainLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (notFound || !tenant) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
                <h1 className="text-3xl font-bold">Organização não encontrada</h1>
                <p className="text-muted-foreground">O endereço acessado não corresponde a nenhuma organização cadastrada.</p>
                <Button asChild variant="outline">
                    <Link to="/">Voltar ao início</Link>
                </Button>
            </div>
        );
    }

    const whatsappNumber = (tenant.whatsapp || "").replace(/\D/g, "");

    return (
        <div className="light min-h-screen bg-white text-gray-900">
            <SeoHead
                title={tenant.nome}
                description={`Conheça as atividades e serviços de ${tenant.nome}. Faça sua inscrição online.`}
            />

            {/* Nav */}
            <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {tenant.logo_url ? (
                            <img src={tenant.logo_url} alt={tenant.nome} className="h-10 sm:h-12 w-auto object-contain" />
                        ) : (
                            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <span className="text-xl font-black text-primary">{tenant.nome.charAt(0)}</span>
                            </div>
                        )}
                        <span className="font-black text-xl tracking-tighter uppercase">{tenant.nome}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <a href="#atividades" className="hidden sm:inline text-sm font-medium hover:text-primary transition-colors">
                            Atividades
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
                    <div className="max-w-2xl space-y-6">
                        <Badge className="w-fit gap-1.5" variant="secondary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse inline-block" />
                            Inscrições Abertas
                        </Badge>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                            Bem-vindo à
                            <span className="text-primary"> {tenant.nome}</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Conheça nossas atividades e faça sua inscrição online. Vagas limitadas.
                        </p>

                        <div className="flex flex-wrap gap-6 pt-2">
                            {[
                                { icon: Users, value: "Vagas", label: "disponíveis" },
                                { icon: Trophy, value: "Ativ.", label: "cadastradas" },
                                { icon: Star, value: "Online", label: "inscrição rápida" },
                            ].map(({ icon: Icon, value, label }) => (
                                <div key={label} className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-primary" />
                                    <span className="font-black text-foreground">{value}</span>
                                    <span className="text-sm text-muted-foreground">{label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <a href="#atividades">
                                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                                    Ver Atividades
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </a>
                            {whatsappNumber && (
                                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                                    <Button size="lg" variant="outline" className="gap-2">
                                        Falar no WhatsApp
                                    </Button>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <ActivitiesSection activities={activities} />
            <LandingFooter tenant={tenant} />
        </div>
    );
};

export default TenantLanding;
