import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type StepStatus = "pending" | "active" | "completed";

type Step = {
  label: string;
  status: StepStatus;
};

type StepIndicatorProps = {
  steps: Step[];
  className?: string;
};

function StepIndicator({ steps, className }: StepIndicatorProps) {
  return (
    <nav
      aria-label="Progresso da verificação"
      className={cn("w-full", className)}
    >
      {/* Desktop: horizontal stepper */}
      <ol className="hidden items-center md:flex">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <li key={step.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  aria-current={step.status === "active" ? "step" : undefined}
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    step.status === "completed" &&
                      "border-primary bg-primary text-primary-foreground",
                    step.status === "active" &&
                      "border-primary bg-background text-primary",
                    step.status === "pending" &&
                      "border-input bg-background text-muted-foreground",
                  )}
                >
                  {step.status === "completed" ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "max-w-20 text-center text-[0.7rem] leading-tight",
                    step.status === "active"
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector bar */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full transition-colors",
                    step.status === "completed" ? "bg-primary" : "bg-input",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: compact bar + label */}
      <div className="md:hidden">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Etapa{" "}
            {steps.findIndex((s) => s.status === "active") + 1} de{" "}
            {steps.length}
          </span>
          <span className="font-medium text-foreground">
            {steps.find((s) => s.status === "active")?.label}
          </span>
        </div>
        <div className="flex gap-1">
          {steps.map((step, index) => (
            <div
              key={index}
              aria-hidden="true"
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                step.status === "completed" && "bg-primary",
                step.status === "active" && "bg-primary/60",
                step.status === "pending" && "bg-input",
              )}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

export { StepIndicator };
export type { Step, StepStatus };
