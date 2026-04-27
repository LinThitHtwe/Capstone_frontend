import type { ReservationAttendanceStatus } from "@/lib/api"
import { cn } from "@/lib/utils"

const STYLES: Record<
  ReservationAttendanceStatus,
  string
> = {
  pending:
    "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-100",
  arrived:
    "border-emerald-500/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100",
  noshow: "border-rose-500/40 bg-rose-500/15 text-rose-900 dark:text-rose-100",
}

export function ReservationAttendanceBadge({
  status,
  className,
}: {
  status: ReservationAttendanceStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums",
        STYLES[status],
        className
      )}
    >
      {status}
    </span>
  )
}
