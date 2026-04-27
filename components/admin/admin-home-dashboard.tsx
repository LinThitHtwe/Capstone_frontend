"use client"

import * as React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  apiAdminListAllReservations,
  apiAdminListLecturers,
  apiAdminListStaff,
  apiAdminListStudents,
  apiAdminListVisitors,
} from "@/lib/api"
import {
  buildReservationsByAvailability,
  buildReservationsByDay,
  buildUsersByRoleFromDirectory,
} from "@/lib/data/admin-chart-data"

import { AdminHomeCharts } from "./admin-home-charts"

function countUpcomingPendingReservations(
  list: { status: string; start_time: string }[]
): number {
  const now = Date.now()
  return list.filter(
    (r) => r.status === "pending" && new Date(r.start_time).getTime() > now
  ).length
}

export function AdminHomeDashboard() {
  const { accessToken, hydrated } = useAuth()
  const [userTotal, setUserTotal] = React.useState<number | null>(null)
  const [reservationTotal, setReservationTotal] = React.useState<number | null>(
    null
  )
  const [upcoming, setUpcoming] = React.useState<number | null>(null)
  const [roleData, setRoleData] = React.useState<ReturnType<
    typeof buildUsersByRoleFromDirectory
  > | null>(null)
  const [availabilityData, setAvailabilityData] = React.useState<ReturnType<
    typeof buildReservationsByAvailability
  > | null>(null)
  const [timelineData, setTimelineData] = React.useState<ReturnType<
    typeof buildReservationsByDay
  > | null>(null)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!hydrated) return
    if (!accessToken) {
      setLoading(false)
      return
    }

    let cancelled = false

    const run = async () => {
      setError("")
      setLoading(true)
      try {
        const [studentsP, staffP, lecturersP, visitorsP, reservations] =
          await Promise.all([
            apiAdminListStudents(accessToken, { page: 1, page_size: 1 }),
            apiAdminListStaff(accessToken, { page: 1, page_size: 1 }),
            apiAdminListLecturers(accessToken, { page: 1, page_size: 1 }),
            apiAdminListVisitors(accessToken, { page: 1, page_size: 1 }),
            apiAdminListAllReservations(accessToken, { ordering: "start_time" }),
          ])
        if (cancelled) return
        setUserTotal(
          studentsP.count + staffP.count + lecturersP.count + visitorsP.count
        )
        setReservationTotal(reservations.length)
        setUpcoming(countUpcomingPendingReservations(reservations))
        setRoleData(
          buildUsersByRoleFromDirectory(
            studentsP.count,
            staffP.count,
            lecturersP.count,
            visitorsP.count
          )
        )
        setAvailabilityData(buildReservationsByAvailability(reservations))
        setTimelineData(buildReservationsByDay(reservations))
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load overview")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [accessToken, hydrated])

  const numberOrDash = (n: number | null) =>
    n === null ? "—" : n.toLocaleString()
  const ready = !loading && !error && roleData && availabilityData && timelineData

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base">Could not load overview</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Users</CardTitle>
            <CardDescription>Registered profiles (all roles)</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className="text-3xl font-semibold tabular-nums"
              aria-busy={loading}
            >
              {numberOrDash(userTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Reservations</CardTitle>
            <CardDescription>All history records</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className="text-3xl font-semibold tabular-nums"
              aria-busy={loading}
            >
              {numberOrDash(reservationTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Upcoming</CardTitle>
            <CardDescription>Future start, not yet checked in</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className="text-3xl font-semibold tabular-nums"
              aria-busy={loading}
            >
              {numberOrDash(upcoming)}
            </p>
          </CardContent>
        </Card>
      </div>

      {ready ? (
        <AdminHomeCharts
          roleData={roleData}
          availabilityData={availabilityData}
          timelineData={timelineData}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Loading charts…</p>
      )}
    </div>
  )
}
