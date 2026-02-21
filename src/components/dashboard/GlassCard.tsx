import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface GlassCardProps {
    title: string;
    value?: string | number;
    icon?: ReactNode;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
    isLoading?: boolean;
    children?: ReactNode;
    color?: string; // Hex color from design system
}

export const GlassCard = ({
    title,
    value,
    icon,
    description,
    trend,
    className,
    isLoading,
    children,
    color = "#E8004F",
}: GlassCardProps) => {
    return (
        <div
            className={cn(
                "glass relative overflow-hidden rounded-2xl p-6 transition-all hover:shadow-2xl hover:shadow-black/20",
                className
            )}
        >
            {/* Top indicator line */}
            <div
                className="absolute top-0 left-0 h-1.5 w-full opacity-80"
                style={{ backgroundColor: color }}
            />

            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <div
                        className="flex items-center justify-center h-10 w-10 rounded-xl bg-card/50 border border-border/50 text-foreground/70"
                        style={{ color: `${color}dd` }}
                    >
                        {icon}
                    </div>
                </div>
                {trend && (
                    <div className="flex items-center gap-1 mt-1">
                        <span
                            className={cn(
                                "flex items-center font-bold text-[11px] py-1 px-2 rounded-lg tracking-tight uppercase",
                                trend.isPositive
                                    ? "text-green-500 bg-green-500/5"
                                    : "text-[#E8004F] bg-[#E8004F]/5"
                            )}
                        >
                            {trend.isPositive ? "↑" : "↓"} {trend.value}%
                            <span className="ml-1.5 opacity-50 font-medium">vs jan</span>
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-6">
                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-32 bg-foreground/5 rounded-lg" />
                        <Skeleton className="h-4 w-48 bg-foreground/5 rounded-lg" />
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col">
                            <h3 className="text-xs font-bold text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
                                {title}
                            </h3>
                            {value !== undefined && (
                                <div className="text-4xl font-black text-foreground tracking-tighter transition-all duration-300">
                                    {value}
                                </div>
                            )}
                        </div>
                        {description && (
                            <p className="mt-2 text-xs text-muted-foreground font-semibold tracking-tight transition-all duration-300">
                                <span style={{ color: color }}>{value}</span> {description.replace(value?.toString() || "", "")}
                            </p>
                        )}
                        {children && <div className="mt-6">{children}</div>}
                    </>
                )}
            </div>
        </div>
    );
};
