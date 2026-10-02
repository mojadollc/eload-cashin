import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      ref={ref}
      className={cn(
        "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[#17202A] placeholder-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-[#038E80] focus:border-transparent transition-all",
        error && "border-red-400 focus:ring-red-400",
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));
Input.displayName = "Input";
export { Input };
