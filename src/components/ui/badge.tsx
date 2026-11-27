import { cn } from "@/lib/utils";

const statusConfig: Record<string, { dot: string; bg: string; text: string }> = {
  SUCCESS:    { dot: "bg-emerald-500", bg: "bg-emerald-50",  text: "text-emerald-700" },
  PENDING:    { dot: "bg-amber-400",   bg: "bg-amber-50",    text: "text-amber-700" },
  PROCESSING: { dot: "bg-blue-500",    bg: "bg-blue-50",     text: "text-blue-700" },
  FAILED:     { dot: "bg-red-500",     bg: "bg-red-50",      text: "text-red-700" },
  REVERSED:   { dot: "bg-orange-500",  bg: "bg-orange-50",   text: "text-orange-700" },
  REFUNDED:   { dot: "bg-purple-500",  bg: "bg-purple-50",   text: "text-purple-700" },
  ACTIVE:     { dot: "bg-emerald-500", bg: "bg-emerald-50",  text: "text-emerald-700" },
  SUSPENDED:  { dot: "bg-red-500",     bg: "bg-red-50",      text: "text-red-700" },
  RESTRICTED: { dot: "bg-orange-500",  bg: "bg-orange-50",   text: "text-orange-700" },
};

export function Badge({ status, className }: { status: string; className?: string }) {
  const cfg = statusConfig[status] || { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold", cfg.bg, cfg.text, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {status}
    </span>
  );
}
