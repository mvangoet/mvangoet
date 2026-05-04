import { getStatusTone } from "@/lib/format";

export function StatusBadge({ label, status }: { label: string; status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusTone(status as never)}`}>{label}</span>;
}
