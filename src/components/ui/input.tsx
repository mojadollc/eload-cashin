import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, ...props }, ref) => (
  <div className="w-full">
    {label && (
      <label className="block text-[13px] font-medium text-slate-700 mb-1.5">{label}</label>
    )}
    <input
      ref={ref}
      className={cn(
        "w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 placeholder-slate-400 text-[14px]",
        "transition-all duration-150 focus:outline-none",
        error
          ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
          : "border-slate-200 focus:border-[#038E80] focus:ring-2 focus:ring-[#038E80]/10",
        className
      )}
      {...props}
    />
    {error && <p className="mt-1.5 text-[12px] text-red-500 font-medium">{error}</p>}
  </div>
));
Input.displayName = "Input";
export { Input };
