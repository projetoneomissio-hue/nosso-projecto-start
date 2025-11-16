import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Atividades", href: "/atividades", icon: GraduationCap },
  { name: "Alunos", href: "/alunos", icon: Users },
  { name: "Professores", href: "/professores", icon: UserCircle },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign },
  { name: "Gestão do Prédio", href: "/predio", icon: Building2 },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col gap-y-5 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">Neo Missio</h1>
      </div>
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
            <Link
              to="/configuracoes"
              className="group flex gap-x-3 rounded-lg p-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <Settings className="h-5 w-5 shrink-0" />
              Configurações
            </Link>
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
