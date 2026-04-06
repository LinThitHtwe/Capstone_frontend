import type { ReservationRecord, StudentRecord } from "./admin-mock"

export type RoleCountPoint = {
  role: string
  count: number
}

export type AvailabilityCountPoint = {
  availability: "available" | "unavailable"
  label: string
  count: number
  fill: string
}

export type DayCountPoint = {
  day: string
  /** Short label for axis */
  label: string
  count: number
}

const AVAILABILITY_META: Record<
  AvailabilityCountPoint["availability"],
  { label: string; fillVar: string }
> = {
  available: { label: "Available", fillVar: "hsl(var(--chart-1))" },
  unavailable: { label: "Unavailable", fillVar: "hsl(var(--chart-3))" },
}

export function buildStudentsByRole(students: StudentRecord[]): RoleCountPoint[] {
  const map = new Map<string, number>()
  for (const s of students) {
    map.set(s.role, (map.get(s.role) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([role, count]) => ({
    role: role.length > 22 ? `${role.slice(0, 20).trim()}…` : role,
    count,
  }))
}

export function buildReservationsByAvailability(
  reservations: ReservationRecord[]
): AvailabilityCountPoint[] {
  const order: AvailabilityCountPoint["availability"][] = [
    "available",
    "unavailable",
  ]
  const map = new Map<AvailabilityCountPoint["availability"], number>()
  for (const a of order) map.set(a, 0)
  for (const r of reservations) {
    const key: AvailabilityCountPoint["availability"] = r.isAvailable
      ? "available"
      : "unavailable"
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return order.map((availability) => ({
    availability,
    label: AVAILABILITY_META[availability].label,
    count: map.get(availability) ?? 0,
    fill: AVAILABILITY_META[availability].fillVar,
  }))
}

const dayFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
})

export function buildReservationsByDay(
  reservations: ReservationRecord[]
): DayCountPoint[] {
  const map = new Map<string, number>()
  for (const r of reservations) {
    const day = r.startTime.slice(0, 10)
    map.set(day, (map.get(day) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({
      day,
      label: dayFormatter.format(new Date(day + "T12:00:00")),
      count,
    }))
}
