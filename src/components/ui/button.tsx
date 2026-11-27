"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, style, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const sizes = { sm: "px-3.5 py-1.5 text-[13px]", md: "px-5 py-2.5 text-[13px]", lg: "px-6 py-3 text-[15px]" };

    const variantStyles: Record<string, { className: string; style?: React.CSSProperties }> = {
      primary: {
        className: "text-white focus:ring-[#038E80] hover:opacity-90 active:scale-[0.98]",
        style: { background: "linear-gradient(135deg, #038E80, #0a9e8f)", boxShadow: "0 4px 14px -3px rgba(3,142,128,0.4)" },
      },
      secondary: {
        className: "text-white focus:ring-[#038E80] hover:opacity-90 active:scale-[0.98]",
        style: { background: "linear-gradient(135deg, #0f172a, #1e293b)" },
      },
      outline: {
        className: "border border-[#038E80] text-[#038E80] hover:bg-[#038E80]/5 focus:ring-[#038E80]",
      },
      ghost: {
        className: "text-[#038E80] hover:bg-[#038E80]/8 focus:ring-[#038E80]",
      },
      danger: {
        className: "text-white bg-red-500 hover:bg-red-600 focus:ring-red-500 active:scale-[0.98]",
      },
    };

    const vs = variantStyles[variant];

    return (
      <button
        ref={ref}
        className={cn(base, vs.className, sizes[size], className)}
        style={{ ...vs.style, ...style }}
        disabled={disabled || loading}
        {...props}>
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export { Button };
