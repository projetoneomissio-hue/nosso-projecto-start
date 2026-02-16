
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStepsProps {
    steps: {
        id: number;
        title: string;
        description?: string;
    }[];
    currentStep: number;
    className?: string;
}

export function WizardSteps({ steps, currentStep, className }: WizardStepsProps) {
    return (
        <div className={cn("w-full py-4", className)}>
            <div className="relative flex justify-between">
                {/* Progress Bar Background */}
                <div className="absolute top-4 left-0 w-full h-1 bg-muted -z-10 rounded-full" />

                {/* Active Progress Bar */}
                <div
                    className="absolute top-4 left-0 h-1 bg-primary -z-10 transition-all duration-300 ease-in-out rounded-full"
                    style={{
                        width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                    }}
                />

                {steps.map((step) => {
                    const isCompleted = currentStep > step.id;
                    const isCurrent = currentStep === step.id;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200",
                                    isCompleted
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : isCurrent
                                            ? "border-primary text-primary ring-4 ring-primary/20"
                                            : "border-muted-foreground/30 text-muted-foreground"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <span className="text-sm font-medium">{step.id}</span>
                                )}
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <span
                                    className={cn(
                                        "text-xs font-semibold uppercase tracking-wider",
                                        isCurrent || isCompleted ? "text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    {step.title}
                                </span>
                                {step.description && (
                                    <span className="text-[10px] text-muted-foreground hidden sm:block max-w-[120px]">
                                        {step.description}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
