import { useUnidade } from "@/contexts/UnidadeContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Building2, ChevronsUpDown, Check, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function UnidadeSwitcher() {
    const { currentUnidade, unidades, switchUnidade } = useUnidade();

    if (!currentUnidade) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn("w-full justify-between", "bg-sidebar-accent/50 text-sidebar-foreground border-sidebar-border")}
                >
                    <div className="flex items-center gap-2 truncate">
                        <Building2 className="h-4 w-4 shrink-0 opacity-70" />
                        <span className="truncate">{currentUnidade.nome}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]" align="start">
                <DropdownMenuLabel>Minhas Escolas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {unidades.map((unidade) => (
                    <DropdownMenuItem
                        key={unidade.id}
                        onSelect={() => switchUnidade(unidade.id)}
                        className="flex items-center justify-between cursor-pointer"
                    >
                        <span className="truncate">{unidade.nome}</span>
                        {currentUnidade.id === unidade.id && <Check className="ml-auto h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-muted-foreground opacity-50">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Unidade
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
