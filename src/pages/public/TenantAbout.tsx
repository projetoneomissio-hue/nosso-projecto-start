import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Instagram, Phone, Heart, Target, Eye, Quote, ChevronRight } from "lucide-react";
import { hexToHSL } from "@/utils/colors";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicTenant, PublicTenant } from "@/contexts/PublicTenantContext";
import { SeoHead } from "@/components/SeoHead";

interface EquipeMembro {
    nome: string;
    cargo: string;
    bio?: string;
    foto_url?: string;
}

interface QuemSomosConfig {
    titulo?: string;
    subtitulo?: string;
    foto_hero_url?: string;
    historia?: string;
    missao?: string;
    visao?: string;
    valores?: string;
    equipe?: EquipeMembro[];
    mostrar_nav?: boolean;
    stats?: Array<{ numero: string; label: string }>;
    depoimento_destaque?: { texto: string; autor: string };
}

interface LandingConfig {
    quem_somos?: QuemSomosConfig;
}

async function fetchTenantBySlug(slug: string): Promise<PublicTenant | null> {
    const { data } = await supabase
        .from("unidades")
        .select("id, nome, slug, logo_url, custom_domain, whatsapp, instagram_url, cor_primaria, email_contato, tipo_instituicao, feature_flags, landing_config")
        .eq("slug", slug)
        .maybeSingle();
    return data ?? null;
}

const TenantAbout = () => {
    const { slug } = useParams<{ slug?: string }>();
    const { tenant: domainTenant, isCustomDomain, isLoading: domainLoading } = usePublicTenant();
    const { isAuthenticated } = useAuth();

    const [tenant, setTenant] = useState<PublicTenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function resolve() {
            setLoading(true);
            let resolved: PublicTenant | null = null;
            if (slug) {
                resolved = await fetchTenantBySlug(slug);
            } else if (isCustomDomain && !domainLoading) {
                resolved = domainTenant;
            }
            if (!resolved) { setNotFound(true); setLoading(false); return; }
            setTenant(resolved);
            setLoading(false);
        }
        if (!domainLoading) resolve();
    }, [slug, domainTenant, isCustomDomain, domainLoading]);

    useEffect(() => {
        if (tenant?.cor_primaria) {
            const hsl = hexToHSL(tenant.cor_primaria);
            document.documentElement.style.setProperty("--primary", hsl);
            document.documentElement.style.setProperty("--ring", hsl);
        }
        return () => {
            document.documentElement.style.removeProperty("--primary");
            document.documentElement.style.removeProperty("--ring");
        };
    }, [tenant?.cor_primaria]);

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
                <h1 className="text-3xl font-bold text-gray-900">Organização não encontrada</h1>
                <Button asChild variant="outline"><Link to="/">Voltar ao início</Link></Button>
            </div>
        );
    }

    const cfg = (tenant.landing_config || {}) as LandingConfig;
    const qs = cfg.quem_somos || {};
    const equipe = qs.equipe || [];
    const stats = qs.stats || [];
    const valores = qs.valores ? qs.valores.split(/[,\n]+/).map(v => v.trim()).filter(Boolean) : [];
    const landingUrl = slug ? `/org/${slug}` : "/";

    const seoTitle = `Quem Somos — ${tenant.nome}`;
    const seoDesc = qs.subtitulo || `Conheça a história, missão e equipe da ${tenant.nome}.`;

    const hasMVV = qs.missao || qs.visao || qs.valores;
    const hasDepoimento = qs.depoimento_destaque?.texto;

    return (
        <div className="light min-h-screen bg-white text-gray-900">
            <SeoHead title={seoTitle} description={seoDesc} />

            {/* Banner preview admin */}
            {isAuthenticated && (
                <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 text-xs font-semibold flex items-center justify-between px-4 py-2 shadow-md">
                    <span>Modo Preview — Página Quem Somos</span>
                    <Link to="/direcao/landing" className="underline underline-offset-2 hover:opacity-80 transition-opacity">
                        ← Voltar ao Editor
                    </Link>
                </div>
            )}

            {/* Nav */}
            <nav className={`fixed w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 ${isAuthenticated ? "top-8" : "top-0"}`}>
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to={landingUrl} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        {tenant.logo_url ? (
                            <img src={tenant.logo_url} alt={tenant.nome} className="h-10 sm:h-12 w-auto object-contain" />
                        ) : (
                            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <span className="text-xl font-black text-primary">{tenant.nome.charAt(0)}</span>
                            </div>
                        )}
                        <span className="font-black text-xl tracking-tighter uppercase text-gray-900">{tenant.nome}</span>
                    </Link>
                    <div className="flex gap-3 items-center">
                        <Link to={landingUrl} className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                            <ArrowLeft className="h-3.5 w-3.5" /> Ver Atividades
                        </Link>
                        <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100">
                            Entrar
                        </Link>
                        <Button size="sm" asChild>
                            <Link to={`/matricula/${tenant.slug}`}>Fazer Inscrição</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            {/* ── HERO ─────────────────────────────────────────────────────────── */}
            <section className={`relative overflow-hidden ${isAuthenticated ? "pt-36 pb-20" : "pt-28 pb-20"}`}>
                {qs.foto_hero_url ? (
                    <>
                        <div className="absolute inset-0">
                            <img src={qs.foto_hero_url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
                        </div>
                        <div className="relative container mx-auto px-4 max-w-3xl text-center space-y-5">
                            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">Quem Somos</Badge>
                            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-white">
                                {qs.titulo || `Conheça a ${tenant.nome}`}
                            </h1>
                            {qs.subtitulo && (
                                <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">{qs.subtitulo}</p>
                            )}
                            <div className="flex flex-wrap gap-3 justify-center pt-2">
                                <Button asChild className="gap-2 shadow-lg">
                                    <Link to={`/matricula/${tenant.slug}`}>Fazer Inscrição <ChevronRight className="h-4 w-4" /></Link>
                                </Button>
                                <Button asChild variant="outline" className="gap-2 border-white/40 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm">
                                    <a href="#historia">Nossa História</a>
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-white to-primary/5" />
                        <div className="relative container mx-auto px-4 max-w-3xl text-center space-y-5">
                            <Badge variant="outline">Quem Somos</Badge>
                            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-gray-900">
                                {qs.titulo || `Conheça a ${tenant.nome}`}
                            </h1>
                            {qs.subtitulo && (
                                <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">{qs.subtitulo}</p>
                            )}
                            <div className="flex flex-wrap gap-3 justify-center pt-2">
                                <Button asChild className="gap-2">
                                    <Link to={`/matricula/${tenant.slug}`}>Fazer Inscrição <ChevronRight className="h-4 w-4" /></Link>
                                </Button>
                                <Button asChild variant="outline" className="gap-2">
                                    <a href="#historia">Nossa História</a>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* ── STATS BAR ────────────────────────────────────────────────────── */}
            {stats.length > 0 && (
                <section className="bg-primary text-white py-10">
                    <div className="container mx-auto px-4">
                        <div className={`grid gap-8 text-center ${stats.length === 2 ? "grid-cols-2" : stats.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
                            {stats.map((s, i) => (
                                <div key={i} className="space-y-1">
                                    <p className="text-4xl sm:text-5xl font-black">{s.numero}</p>
                                    <p className="text-sm font-medium text-white/80 uppercase tracking-wide">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── HISTÓRIA ─────────────────────────────────────────────────────── */}
            {qs.historia && (
                <section id="historia" className="py-20">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <div className="flex items-start gap-4 mb-8">
                            <span className="h-10 w-1 bg-primary rounded-full mt-1 shrink-0" />
                            <div>
                                <Badge variant="outline" className="mb-2">Nossa História</Badge>
                                <h2 className="text-3xl font-bold text-gray-900">Como tudo começou</h2>
                            </div>
                        </div>
                        <div className="prose prose-gray max-w-none">
                            {qs.historia.split(/\n\n+/).map((p, i) => (
                                <p key={i} className="text-gray-600 leading-relaxed text-base mb-4 last:mb-0">{p}</p>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── DEPOIMENTO DESTAQUE ───────────────────────────────────────────── */}
            {hasDepoimento && (
                <section className="py-16 bg-gray-50">
                    <div className="container mx-auto px-4 max-w-2xl">
                        <div className="relative bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-gray-100 text-center">
                            <Quote className="h-10 w-10 text-primary/20 mx-auto mb-4" />
                            <blockquote className="text-xl sm:text-2xl font-medium text-gray-800 leading-relaxed italic mb-6">
                                "{qs.depoimento_destaque!.texto}"
                            </blockquote>
                            {qs.depoimento_destaque!.autor && (
                                <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                                    — {qs.depoimento_destaque!.autor}
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ── CTA INTERMEDIÁRIO ────────────────────────────────────────────── */}
            {(qs.historia || hasDepoimento) && (
                <section className="py-12 border-y border-gray-100">
                    <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl">
                        <div>
                            <p className="font-bold text-gray-900 text-lg">Quer fazer parte dessa história?</p>
                            <p className="text-sm text-gray-500">Vagas limitadas. Inscreva-se agora.</p>
                        </div>
                        <Button asChild size="lg" className="gap-2 shrink-0">
                            <Link to={`/matricula/${tenant.slug}`}>Fazer Inscrição <ChevronRight className="h-4 w-4" /></Link>
                        </Button>
                    </div>
                </section>
            )}

            {/* ── MISSÃO / VISÃO / VALORES ─────────────────────────────────────── */}
            {hasMVV && (
                <section className="py-20 bg-gray-50">
                    <div className="container mx-auto px-4 max-w-5xl">
                        <div className="text-center mb-12">
                            <Badge variant="outline" className="mb-3">Propósito</Badge>
                            <h2 className="text-3xl font-bold text-gray-900">O que nos move</h2>
                        </div>
                        <div className={`grid gap-6 ${[qs.missao, qs.visao, qs.valores].filter(Boolean).length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
                            {qs.missao && (
                                <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm space-y-4 group hover:border-primary/30 hover:shadow-md transition-all">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                                        <Target className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-2">Missão</h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">{qs.missao}</p>
                                    </div>
                                </div>
                            )}
                            {qs.visao && (
                                <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm space-y-4 group hover:border-primary/30 hover:shadow-md transition-all">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                                        <Eye className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-2">Visão</h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">{qs.visao}</p>
                                    </div>
                                </div>
                            )}
                            {qs.valores && (
                                <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm space-y-4 group hover:border-primary/30 hover:shadow-md transition-all">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                                        <Heart className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-2">Valores</h3>
                                        {valores.length > 1 ? (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {valores.map((v, i) => (
                                                    <span key={i} className="px-3 py-1 bg-primary/8 text-primary text-xs font-semibold rounded-full border border-primary/20">
                                                        {v}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-600 leading-relaxed">{qs.valores}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ── EQUIPE ───────────────────────────────────────────────────────── */}
            {equipe.length > 0 && (
                <section className="py-20">
                    <div className="container mx-auto px-4 max-w-5xl">
                        <div className="text-center mb-12">
                            <Badge variant="outline" className="mb-3">Nossa Equipe</Badge>
                            <h2 className="text-3xl font-bold text-gray-900">As pessoas por trás da {tenant.nome}</h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {equipe.map((membro, i) => (
                                <div key={i} className="text-center group">
                                    <div className="relative h-24 w-24 rounded-full mx-auto overflow-hidden bg-primary/10 flex items-center justify-center border-4 border-white shadow-md group-hover:shadow-lg group-hover:border-primary/30 transition-all mb-4">
                                        <span className="text-3xl font-black text-primary uppercase">{membro.nome.charAt(0)}</span>
                                        {membro.foto_url && (
                                            <img
                                                src={membro.foto_url}
                                                alt={membro.nome}
                                                className="absolute inset-0 h-full w-full object-cover"
                                                onError={e => e.currentTarget.remove()}
                                            />
                                        )}
                                    </div>
                                    <p className="font-bold text-gray-900">{membro.nome}</p>
                                    <p className="text-xs text-primary font-semibold uppercase tracking-wide mt-0.5">{membro.cargo}</p>
                                    {membro.bio && (
                                        <p className="text-xs text-gray-500 leading-relaxed mt-2 max-w-[180px] mx-auto">{membro.bio}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── CTA FINAL / CANAIS ───────────────────────────────────────────── */}
            <section className="py-20 bg-gray-900 text-white">
                <div className="container mx-auto px-4 text-center max-w-xl space-y-6">
                    <h2 className="text-3xl font-bold">Venha fazer parte</h2>
                    <p className="text-gray-400 leading-relaxed">
                        Siga nossas redes, mande uma mensagem ou venha pessoalmente conhecer nosso espaço.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        {tenant.instagram_url && (
                            <Button variant="outline" className="gap-2 border-white/20 text-white bg-transparent hover:bg-white/10" asChild>
                                <a href={tenant.instagram_url.startsWith("http") ? tenant.instagram_url : `https://instagram.com/${tenant.instagram_url.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
                                    <Instagram className="h-4 w-4" /> Instagram
                                </a>
                            </Button>
                        )}
                        {tenant.whatsapp && (
                            <Button variant="outline" className="gap-2 border-white/20 text-white bg-transparent hover:bg-white/10" asChild>
                                <a href={`https://wa.me/${tenant.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                                    <Phone className="h-4 w-4" /> WhatsApp
                                </a>
                            </Button>
                        )}
                        <Button className="gap-2" asChild>
                            <Link to={`/matricula/${tenant.slug}`}>Fazer Inscrição <ChevronRight className="h-4 w-4" /></Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer mínimo */}
            <footer className="py-6 border-t text-center text-xs text-gray-400 bg-white">
                <Link to={landingUrl} className="hover:text-primary transition-colors">
                    ← Voltar para {tenant.nome}
                </Link>
            </footer>
        </div>
    );
};

export default TenantAbout;
