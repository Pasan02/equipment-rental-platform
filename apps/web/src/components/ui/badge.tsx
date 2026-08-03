import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "info" | "brand";
}

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "border-blue-200 bg-blue-50 text-blue-700",
    secondary: "border-slate-200 bg-slate-100 text-slate-700",
    outline: "border-slate-300 text-slate-700 bg-white",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    destructive: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-sky-200 bg-sky-50 text-sky-700",
    brand: "border-blue-600 bg-blue-600 text-white font-semibold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Badge };



