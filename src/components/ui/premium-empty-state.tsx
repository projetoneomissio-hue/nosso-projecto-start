import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface PremiumEmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const PremiumEmptyState = ({
    title,
    description,
    icon: Icon,
    actionLabel,
    onAction,
    className = "",
}: PremiumEmptyStateProps) => {
    return (
        <Card className={`flex flex-col items-center justify-center py-16 px-4 text-center border-dashed border-2 bg-gradient-to-b from-background to-secondary/20 animate-in fade-in zoom-in duration-500 rounded-2xl ${className}`}>
            <div className="bg-primary/10 p-4 rounded-full mb-6 ring-8 ring-primary/5">
                <Icon className="h-10 w-10 text-primary" />
            </div>

            <h3 className="text-2xl font-bold tracking-tight text-foreground font-jakarta mb-2">
                {title}
            </h3>

            <p className="text-muted-foreground max-w-[400px] mb-8 text-balance">
                {description}
            </p>

            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    size="lg"
                    className="btn-premium gap-2 px-8 shadow-indigo-200"
                >
                    {actionLabel}
                </Button>
            )}
        </Card>
    );
};
