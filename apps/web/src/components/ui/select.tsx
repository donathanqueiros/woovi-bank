import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type SelectProps = React.ComponentProps<"select">;

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      data-slot="select"
      className={cn(
        "flex h-10 w-full appearance-none rounded-xl border border-border/80 bg-background/90 px-3.5 py-2 text-sm text-foreground shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--background)_65%,white)] outline-none transition-[border-color,box-shadow,background-color] focus-visible:border-primary/25 focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export { Select };
