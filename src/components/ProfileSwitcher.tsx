import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    Building2,
    Users,
    GraduationCap,
    UserCircle,
    ArrowLeftRight,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const roleConfig: Record<UserRole, { label: string; icon: typeof Building2; dashboardPath: string }> = {
    direcao: { label: "Direção", icon: Building2, dashboardPath: "/dashboard" },
    coordenacao: { label: "Coordenação", icon: Users, dashboardPath: "/dashboard" },
    professor: { label: "Professor", icon: GraduationCap, dashboardPath: "/dashboard" },
    responsavel: { label: "Responsável", icon: UserCircle, dashboardPath: "/responsavel/dashboard" },
};

interface ProfileSwitcherProps {
    isCollapsed?: boolean;
}

export const ProfileSwitcher = ({ isCollapsed = false }: ProfileSwitcherProps) => {
    const { user, setActiveRole } = useAuth();
    const navigate = useNavigate();

    if (!user || user.roles.length <= 1) return null;

    const activeConfig = roleConfig[user.activeRole];
    const ActiveIcon = activeConfig.icon;

    const handleSwitch = (role: string) => {
        const newRole = role as UserRole;
        if (newRole !== user.activeRole) {
            setActiveRole(newRole);
            const config = roleConfig[newRole];
            navigate(config.dashboardPath);
        }
    };

    if (isCollapsed) {
        return (
            <button
                onClick={() => {
                    // Cycle through roles
                    const currentIndex = user.roles.indexOf(user.activeRole);
                    const nextIndex = (currentIndex + 1) % user.roles.length;
                    handleSwitch(user.roles[nextIndex]);
                }}
                className="flex items-center justify-center w-full p-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all duration-300 group"
                title={`Trocar perfil (${activeConfig.label})`}
            >
                <ArrowLeftRight className="h-4 w-4 text-primary group-hover:rotate-180 transition-transform duration-500" />
            </button>
        );
    }

    return (
        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2 px-1">
                <ArrowLeftRight className="h-3 w-3 text-primary/70" />
                <span className="text-[9px] font-black text-primary/70 uppercase tracking-[0.2em]">
                    Trocar Perfil
                </span>
            </div>

            <Select value={user.activeRole} onValueChange={handleSwitch}>
                <SelectTrigger
                    className={cn(
                        "w-full bg-background/50 border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider",
                        "hover:bg-background/80 transition-all duration-300",
                        "focus:ring-primary/30"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <ActiveIcon className="h-3.5 w-3.5 text-primary" />
                        <SelectValue />
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
                    {user.roles.map((role) => {
                        const config = roleConfig[role];
                        const Icon = config.icon;
                        return (
                            <SelectItem
                                key={role}
                                value={role}
                                className="rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className="h-3.5 w-3.5 text-primary/70" />
                                    {config.label}
                                </div>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
};
