import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface ChipProps extends React.ComponentPropsWithoutRef<"button"> {
  selected?: boolean;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
          "border border-transparent bg-white/70 text-slate-600 hover:bg-white hover:text-slate-900",
          selected && "bg-slate-900 text-white shadow-sm",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Chip.displayName = "Chip";

export default Chip;
