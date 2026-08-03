import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "ghost" | "link" | "accent";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98] duration-150";

    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-blue-600/20",
      secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200",
      outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm",
      destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
      ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      link: "text-blue-600 underline-offset-4 hover:underline",
      accent: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    };

    const sizes = {
      default: "h-9 px-4 py-2 text-xs font-semibold",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-11 rounded-xl px-6 text-sm font-semibold",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };



