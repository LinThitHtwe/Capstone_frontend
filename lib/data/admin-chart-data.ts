import type { AdminReservation, ReservationAttendanceStatus } from "@/lib/api"

import type { ReservationRecord, StudentRecord } from "./admin-mock"

export type RoleCountPoint = {
  role: string
  count: number
}

export type AvailabilityCountPoint = {
  status: ReservationAttendanceStatus
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
  ReservationAttendanceStatus,
  { label: string; fillVar: string }
> = {
  pending: { label: "pending", fillVar: "hsl(var(--chart-4))" },
  arrived: { label: "arrived", fillVar: "hsl(var(--chart-2))" },
  noshow: { label: "noshow", fillVar: "hsl(var(--chart-3))" },
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

/** Counts from admin directory list endpoints (students+members, staff, lecturers, visitors). */
export function buildUsersByRoleFromDirectory(
  studentsCount: number,
  staffCount: number,
  lecturersCount: number,
  visitorsCount: number
): RoleCountPoint[] {
  return [
    { role: "Student", count: studentsCount },
    { role: "Staff", count: staffCount },
    { role: "Lecturer", count: lecturersCount },
    { role: "Visitor", count: visitorsCount },
  ]
}

type ReservationForAvailability = { status: ReservationAttendanceStatus }
type ReservationForDay = ReservationRecord | AdminReservation

function chartStartDayKey(r: ReservationForDay): string {
  if ("start_time" in r) {
    return r.start_time.slice(0, 10)
  }
  return r.startTime.slice(0, 10)
}

export function buildReservationsByAvailability(
  reservations: ReservationForAvailability[]
): AvailabilityCountPoint[] {
  const order: ReservationAttendanceStatus[] = ["pending", "arrived", "noshow"]
  const map = new Map<ReservationAttendanceStatus, number>()
  for (const a of order) map.set(a, 0)
  for (const r of reservations) {
    const key = r.status
    map.set(key, (map.get(key) ?? 0) + 1)
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
  reservations: ReservationForDay[]
): DayCountPoint[] {
  const map = new Map<string, number>()
  for (const r of reservations) {
    const day = chartStartDayKey(r)
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
