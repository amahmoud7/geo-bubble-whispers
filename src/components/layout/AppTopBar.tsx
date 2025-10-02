import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AppTopBarProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  translucent?: boolean;
}

export const AppTopBar = ({
  title,
  subtitle,
  leading,
  trailing,
  className,
  translucent = true,
}: AppTopBarProps) => {
  return (
    <header
      className={cn(
        "relative z-40 w-full",
        translucent && "bg-white/80 backdrop-blur-xl border-b border-white/40",
        className
      )}
      style={{ paddingTop: "env(safe-area-inset-top, 16px)" }}
    >
      <div className="px-5 pb-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {leading ? (
              <div className="shrink-0">{leading}</div>
            ) : null}
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
      </div>
    </header>
  );
};

export default AppTopBar;
