import type { ReservationRecord, StudentRecord } from "./admin-mock"

export type ProgramCountPoint = {
  program: string
  count: number
}

export type StatusCountPoint = {
  status: string
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

const STATUS_META: Record<
  ReservationRecord["status"],
  { label: string; fillVar: string }
> = {
  confirmed: { label: "Confirmed", fillVar: "hsl(var(--chart-1))" },
  completed: { label: "Completed", fillVar: "hsl(var(--chart-2))" },
  cancelled: { label: "Cancelled", fillVar: "hsl(var(--chart-3))" },
}

export function buildStudentsByProgram(
  students: StudentRecord[]
): ProgramCountPoint[] {
  const map = new Map<string, number>()
  for (const s of students) {
    map.set(s.program, (map.get(s.program) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([program, count]) => ({
    program:
      program.length > 22 ? `${program.slice(0, 20).trim()}…` : program,
    count,
  }))
}

export function buildReservationsByStatus(
  reservations: ReservationRecord[]
): StatusCountPoint[] {
  const order: ReservationRecord["status"][] = [
    "confirmed",
    "completed",
    "cancelled",
  ]
  const map = new Map<ReservationRecord["status"], number>()
  for (const s of order) map.set(s, 0)
  for (const r of reservations) {
    map.set(r.status, (map.get(r.status) ?? 0) + 1)
  }
  return order.map((status) => ({
    status,
    label: STATUS_META[status].label,
    count: map.get(status) ?? 0,
    fill: STATUS_META[status].fillVar,
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
    const day = r.startAt.slice(0, 10)
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
