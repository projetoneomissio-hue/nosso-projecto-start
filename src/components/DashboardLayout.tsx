import { ReactNode } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";

interface DashboardLayoutProps {
  children: ReactNode;
}

const getNavigationByRole = (role: string) => {
  switch (role) {
    case "direcao":
      return [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Usuários", href: "/direcao/usuarios", icon: Users },
        { name: "Professores", href: "/professores", icon: UserCircle },
        { name: "Atividades", href: "/atividades", icon: GraduationCap },
        { name: "Matrículas", href: "/direcao/matriculas", icon: FileText },
        { name: "Financeiro", href: "/financeiro", icon: DollarSign },
        { name: "Gestão do Prédio", href: "/predio", icon: Building2 },
      ];
    case "coordenacao":
      return [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Matrículas Pendentes", href: "/coordenacao/matriculas-pendentes", icon: FileText },
        { name: "Atividades", href: "/atividades", icon: GraduationCap },
        { name: "Professores", href: "/professores", icon: UserCircle },
        { name: "Inadimplentes", href: "/coordenacao/inadimplentes", icon: DollarSign },
        { name: "Relatórios", href: "/coordenacao/relatorios", icon: TrendingUp },
      ];
    case "professor":
      return [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Minhas Turmas", href: "/professor/turmas", icon: GraduationCap },
        { name: "Alunos", href: "/professor/alunos", icon: Users },
        { name: "Presença", href: "/professor/presenca", icon: UserCheck },
        { name: "Observações", href: "/professor/observacoes", icon: ClipboardList },
        { name: "Comissões", href: "/professor/comissoes", icon: DollarSign },
      ];
    case "responsavel":
      return [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Atividades", href: "/responsavel/atividades", icon: GraduationCap },
        { name: "Pagamentos", href: "/responsavel/pagamentos", icon: DollarSign },
        { name: "Relatórios", href: "/responsavel/relatorios", icon: FileText },
        { name: "Nova Matrícula", href: "/responsavel/matricula", icon: UserCircle },
        { name: "Anamnese", href: "/responsavel/anamnese", icon: ClipboardList },
      ];
    default:
      return [];
  }
};

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigation = user ? getNavigationByRole(user.role) : [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-full flex-col gap-y-5 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">Neo Missio</h1>
      </div>
      {user && (
        <div className="px-6 -mt-2">
          <p className="text-xs text-muted-foreground">Logado como:</p>
          <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
        </div>
      )}
      <nav className="flex flex-1 flex-col px-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "group flex gap-x-3 rounded-lg p-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              </li>
            );
          })}
          <li className="mt-auto">
            <Separator className="mb-2" />
            <Link
              to="/configuracoes"
              className="group flex gap-x-3 rounded-lg p-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <Settings className="h-5 w-5 shrink-0" />
              Configurações
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-x-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Sair
            </Button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64">
        <div className="h-full overflow-y-auto bg-background">
          {children}
        </div>
      </main>
    </div>
  );
};
