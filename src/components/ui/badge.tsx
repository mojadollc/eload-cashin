import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700",
  REVERSED: "bg-orange-100 text-orange-700",
  REFUNDED: "bg-purple-100 text-purple-700",
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-red-100 text-red-700",
  RESTRICTED: "bg-orange-100 text-orange-700",
};

export function Badge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", statusColors[status] || "bg-gray-100 text-gray-700", className)}>
      {status}
    </span>
  );
}
