import type { ReservationRecord } from "@/lib/data/admin-mock"
import type { AdminTableRecord } from "@/lib/library-map"

export type TableMapStatus = "free" | "reserved" | "occupied"

/** Upcoming reservation within this window counts as “reserved” on the map. */
const UPCOMING_WINDOW_MS = 48 * 60 * 60 * 1000

export function getTableMapStatus(
  table: AdminTableRecord,
  reservations: ReservationRecord[],
  now: Date
): TableMapStatus {
  if (!table.isAvailable) return "occupied"

  const t = now.getTime()
  const forTable = reservations.filter((r) => r.tableNumber === table.tableNumber)

  for (const r of forTable) {
    const start = new Date(r.startTime).getTime()
    const end = new Date(r.endTime).getTime()
    if (end <= t) continue
    if (t >= start && t < end) return "reserved"
    if (t < start && start - t <= UPCOMING_WINDOW_MS) return "reserved"
  }

  return "free"
}

export function tableMapStatusLabel(status: TableMapStatus): string {
  switch (status) {
    case "occupied":
      return "Occupied"
    case "reserved":
      return "Reserved"
    case "free":
    default:
      return "Free"
  }
}
