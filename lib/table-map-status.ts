import {
  TABLE_STATUS_FREE,
  TABLE_STATUS_OCCUPIED,
  TABLE_STATUS_RESERVED,
} from "@/lib/api"
import type { AdminTableRecord } from "@/lib/library-map"

export type TableMapStatus = "free" | "reserved" | "occupied" | "offline"

/** Shape needed to colour the map (matches API + legacy mock rows). */
export type MapReservationForStatus = {
  tableNumber: number
  startTime: string
  endTime: string
}

/** Upcoming reservation within this window counts as “reserved” on the map. */
const UPCOMING_WINDOW_MS = 48 * 60 * 60 * 1000

function reservationStatus(
  table: AdminTableRecord,
  reservations: MapReservationForStatus[],
  now: Date
): "reserved" | null {
  const t = now.getTime()
  const forTable = reservations.filter((r) => r.tableNumber === table.tableNumber)

  for (const r of forTable) {
    const start = new Date(r.startTime).getTime()
    const end = new Date(r.endTime).getTime()
    if (end <= t) continue
    if (t >= start && t < end) return "reserved"
    if (t < start && start - t <= UPCOMING_WINDOW_MS) return "reserved"
  }
  return null
}

/**
 * Map colour follows ``Table.status`` from Django (IoT POST + admin): 1=free, 2=occupied,
 * 3=reserved. When status is **free**, we do not infer reserved/occupied from bookings or
 * the weight sensor so the public map matches firmware LEDs.
 *
 * `sensorSeated` / reservations are only used if ``status`` is missing or not 1/2/3.
 */
export function getTableMapStatus(
  table: AdminTableRecord,
  reservations: MapReservationForStatus[],
  now: Date,
  sensorSeated: boolean
): TableMapStatus {
  if (!table.isAvailable) return "offline"

  const persisted = table.status ?? TABLE_STATUS_FREE
  if (persisted === TABLE_STATUS_OCCUPIED) return "occupied"
  if (persisted === TABLE_STATUS_RESERVED) return "reserved"
  if (persisted === TABLE_STATUS_FREE) return "free"

  if (reservationStatus(table, reservations, now) === "reserved") {
    return "reserved"
  }

  if (sensorSeated) return "occupied"

  return "free"
}

export function tableMapStatusLabel(status: TableMapStatus): string {
  switch (status) {
    case "offline":
      return "Unavailable"
    case "occupied":
      return "Seated"
    case "reserved":
      return "Reserved"
    case "free":
    default:
      return "Open"
  }
}
