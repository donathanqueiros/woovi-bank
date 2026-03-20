import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { Check } from "lucide-react";

type CheckboxProps = Omit<React.ComponentProps<"input">, "type"> & {
  label?: string;
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, id, ...props },
  ref,
) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2",
        props.disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="relative flex size-4 shrink-0 items-center justify-center rounded border border-input transition-colors has-checked:border-primary has-checked:bg-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={cn("peer absolute inset-0 opacity-0", className)}
          {...props}
        />
        <Check
          className="hidden size-3 text-primary-foreground peer-checked:block"
          strokeWidth={3}
        />
      </span>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </label>
  );
});

export { Checkbox };
