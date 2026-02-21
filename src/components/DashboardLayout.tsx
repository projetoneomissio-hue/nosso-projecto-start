import { useState, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  GraduationCap,
  Users,
  UserCircle,
  DollarSign,
  Building2,
  Settings,
  Menu,
  LogOut,
  FileText,
  UserCheck,
  Calendar,
  ClipboardList,
  TrendingUp,
  LayoutDashboard,
  Dumbbell,
  UserCog,
  AlertCircle,
  BarChart,
  Mail,
  CheckCircle2,
  Link as LinkIcon,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import { UnidadeSwitcher } from "@/components/UnidadeSwitcher";
import { InstallPWA } from "@/components/InstallPWA";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardLayoutProps {
  children: ReactNode;
}

const getNavigationByRole = (role: string) => {
  const nav: Record<string, any[]> = {
    direcao: [
      {
        group: "Gestão",
        items: [
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ]
      },
      {
        group: "Acadêmico",
        items: [
          { name: "Atividades", href: "/atividades", icon: Dumbbell },
          { name: "Turmas", href: "/coordenacao/turmas", icon: Users },
          { name: "Matrículas", href: "/direcao/matriculas", icon: FileText },
          { name: "Matrículas Pendentes", href: "/coordenacao/matriculas-pendentes", icon: ClipboardList },
        ]
      },
      {
        group: "Pessoas",
        items: [
          { name: "Alunos", href: "/alunos", icon: Users },
          { name: "Professores", href: "/professores", icon: GraduationCap },
          { name: "Coordenadores", href: "/direcao/coordenadores", icon: UserCog },
          { name: "Usuários", href: "/direcao/usuarios", icon: UserCog },
          { name: "Convites", href: "/convites", icon: Mail },
        ]
      },
      {
        group: "Operacional",
        items: [
          { name: "Financeiro", href: "/financeiro", icon: DollarSign },
          { name: "Link Pagamento", href: "/coordenacao/gerar-link-pagamento", icon: LinkIcon },
          { name: "Prédio", href: "/predio", icon: Building2 },
        ]
      },
      {
        group: "Comunicação",
        items: [
          { name: "Comunicados", href: "/direcao/comunicados", icon: Megaphone },
          { name: "Notificações", href: "/coordenacao/notificacoes", icon: AlertCircle },
        ]
      }
    ],
    coordenacao: [
      {
        group: "Gestão",
        items: [
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ]
      },
      {
        group: "Acadêmico",
        items: [
          { name: "Minhas Atividades", href: "/atividades", icon: Dumbbell },
          { name: "Turmas", href: "/coordenacao/turmas", icon: Users },
          { name: "Alunos", href: "/alunos", icon: Users },
          { name: "Matrículas Pendentes", href: "/coordenacao/matriculas-pendentes", icon: FileText },
        ]
      },
      {
        group: "Operacional",
        items: [
          { name: "Inadimplentes", href: "/coordenacao/inadimplentes", icon: AlertCircle },
          { name: "Link Pagamento", href: "/coordenacao/gerar-link-pagamento", icon: LinkIcon },
          { name: "Voluntários", href: "/coordenacao/voluntarios", icon: UserCheck },
          { name: "Financeiro", href: "/financeiro", icon: DollarSign },
        ]
      },
      {
        group: "Relatórios",
        items: [
          { name: "Notificações", href: "/coordenacao/notificacoes", icon: Mail },
          { name: "Relatórios", href: "/coordenacao/relatorios", icon: BarChart },
        ]
      }
    ],
    professor: [
      {
        group: "Gestão",
        items: [
          { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ]
      },
      {
        group: "Acadêmico",
        items: [
          { name: "Minhas Turmas", href: "/professor/turmas", icon: Users },
          { name: "Chamada / Frequência", href: "/professor/chamada", icon: ClipboardList },
          { name: "Meus Alunos", href: "/professor/alunos", icon: Users },
          { name: "Presença", href: "/professor/presenca", icon: Calendar },
          { name: "Observações", href: "/professor/observacoes", icon: FileText },
        ]
      },
      {
        group: "Financeiro",
        items: [
          { name: "Comissões", href: "/professor/comissoes", icon: DollarSign },
        ]
      }
    ],
    responsavel: [
      {
        group: "Gestão",
        items: [
          { name: "Dashboard", href: "/responsavel/dashboard", icon: LayoutDashboard },
        ]
      },
      {
        group: "Acadêmico",
        items: [
          { name: "Cadastrar Aluno", href: "/responsavel/cadastrar-aluno", icon: UserCircle },
          { name: "Nova Matrícula", href: "/responsavel/nova-matricula", icon: FileText },
          { name: "Atividades Matriculadas", href: "/responsavel/atividades-matriculadas", icon: Dumbbell },
          { name: "Anamnese", href: "/responsavel/anamnese", icon: FileText },
        ]
      },
      {
        group: "Financeiro",
        items: [
          { name: "Pagamentos", href: "/responsavel/pagamentos", icon: DollarSign },
          { name: "Registrar Pagamento", href: "/responsavel/registrar-pagamento", icon: CheckCircle2 },
        ]
      },
      {
        group: "Relatórios",
        items: [
          { name: "Relatórios do Aluno", href: "/responsavel/relatorios-aluno", icon: BarChart },
        ]
      }
    ]
  };
  return nav[role] || [];
};

const Sidebar = ({ isCollapsed, toggleCollapsed }: { isCollapsed: boolean; toggleCollapsed: () => void }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigation = user ? getNavigationByRole(user.role) : [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={cn(
      "flex h-full flex-col bg-background/20 backdrop-blur-3xl border-r border-white/10 transition-all duration-500 ease-in-out relative group",
      isCollapsed ? "w-20" : "w-72"
    )}>
      {/* Sidebar Pulse Indicator (Integrated) */}
      <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-primary/30 to-transparent group-hover:via-primary/60 transition-all duration-700" />

      {/* Header */}
      <div className={cn(
        "flex h-20 shrink-0 items-center border-b border-white/5 px-6 transition-all duration-500",
        isCollapsed ? "justify-center px-0" : "justify-between"
      )}>
        {!isCollapsed ? (
          <h1 className="text-xl font-black tracking-tighter text-foreground uppercase italic group/logo cursor-default">
            Neo <span className="text-primary group-hover/logo:drop-shadow-[0_0_8px_hsl(var(--primary))] transition-all">Missio</span>
          </h1>
        ) : (
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <span className="text-white font-black italic">N</span>
          </div>
        )}
      </div>

      <div className={cn("px-4 mt-6 transition-all duration-500", isCollapsed && "px-2")}>
        {!isCollapsed ? (
          <UnidadeSwitcher />
        ) : (
          <div className="flex justify-center">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5">
                    <Building2 className="h-5 w-5 text-primary/70" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Unidades</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col px-4 overflow-y-auto mt-6 custom-scrollbar scrollbar-hide">
        <TooltipProvider delayDuration={0}>
          <ul role="list" className="flex flex-1 flex-col gap-y-6">
            {navigation.map((group) => (
              <li key={group.group}>
                {!isCollapsed && (
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 px-2 opacity-50">
                    {group.group}
                  </h3>
                )}
                <ul className="space-y-1">
                  {group.items.map((item: any) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              to={item.href}
                              className={cn(
                                "group relative flex gap-x-3 rounded-xl p-2.5 transition-all duration-300",
                                isActive
                                  ? "bg-primary text-white shadow-[0_8px_16px_-4px_hsl(var(--primary)/0.4)]"
                                  : "text-foreground/60 hover:bg-white/5 hover:text-foreground",
                                isCollapsed && "justify-center p-3"
                              )}
                            >
                              <item.icon className={cn(
                                "shrink-0 transition-transform duration-300 group-hover:scale-110",
                                isCollapsed ? "h-5 w-5" : "h-4 w-4",
                                isActive ? "text-white" : "text-primary/70"
                              )} />
                              {!isCollapsed && (
                                <span className="text-[11px] font-black uppercase tracking-widest truncate">
                                  {item.name}
                                </span>
                              )}
                              {isActive && !isCollapsed && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-r-full shadow-[0_0_10px_white]" />
                              )}
                            </Link>
                          </TooltipTrigger>
                          {isCollapsed && (
                            <TooltipContent side="right" className="font-black text-[10px] uppercase tracking-widest bg-primary text-white border-none">
                              {item.name}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </TooltipProvider>
      </nav>

      <div className={cn("p-4 mt-auto transition-all duration-500", isCollapsed && "p-2")}>
        <div className="space-y-2">
          {!isCollapsed && user && (
            <div className="mb-4 p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 backdrop-blur-sm">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary/20">
                {user.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-foreground truncate uppercase tracking-widest">{user.name}</p>
                <p className="text-[8px] font-bold text-muted-foreground truncate uppercase opacity-50">{user.role}</p>
              </div>
            </div>
          )}

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/configuracoes"
                  className={cn(
                    "group flex gap-x-3 rounded-xl p-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300",
                    isCollapsed ? "justify-center" : "text-foreground/60 hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Settings className={cn("shrink-0 text-primary/70", isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                  {!isCollapsed && "Configurações"}
                </Link>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Configurações</TooltipContent>}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-x-3 rounded-xl p-2.5 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/10 hover:text-primary",
                    isCollapsed && "justify-center"
                  )}
                  onClick={handleLogout}
                >
                  <LogOut className={cn("shrink-0", isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                  {!isCollapsed && "Sair"}
                </Button>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Sair</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className={cn("mt-4 transition-all duration-500", isCollapsed && "scale-0 h-0 overflow-hidden")}>
          <InstallPWA />
          <div className="mt-4 flex justify-center">
            <ModeToggle />
          </div>
        </div>
      </div>

      {/* Toggle Button (Desktop Only) */}
      <button
        onClick={toggleCollapsed}
        className="hidden lg:flex absolute -right-3 top-24 h-6 w-6 items-center justify-center rounded-full bg-primary text-white border border-white/20 shadow-lg hover:scale-110 transition-all z-[100]"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </div>
  );
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-conhecimento/10 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4 pointer-events-none" />

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-col transition-all duration-500 ease-in-out h-full z-50",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <Sidebar isCollapsed={isCollapsed} toggleCollapsed={() => setIsCollapsed(!isCollapsed)} />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-6 left-6 z-[60]">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="glass rounded-xl shadow-lg border-white/20 hover:scale-110 active:scale-95 transition-all">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0 bg-transparent border-none shadow-none">
            <Sidebar isCollapsed={false} toggleCollapsed={() => { }} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden relative">
        <div className="h-full overflow-y-auto bg-background/30 backdrop-blur-[2px] transition-all duration-300 hover:bg-background/20 scrollbar-hide">
          {children}
        </div>
      </main>
    </div>
  );
};
