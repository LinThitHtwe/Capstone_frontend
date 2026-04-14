"use client"

import * as React from "react"
import Link from "next/link"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiMeListReservations, type UserReservation } from "@/lib/api"
import { LIBRARY_TIMEZONE } from "@/lib/library-reservation-time"

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatRange(start: string, end: string) {
  return `${formatter.format(new Date(start))} → ${formatter.format(new Date(end))}`
}

export function MyReservationsClient() {
  const { accessToken, isAuthenticated, isAdmin, hydrated } = useAuth()
  const [rows, setRows] = React.useState<UserReservation[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!hydrated || !isAuthenticated || !accessToken || isAdmin) {
      setRows(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const list = await apiMeListReservations(accessToken)
        if (!cancelled) {
          setRows(list)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setRows([])
          setError(e instanceof Error ? e.message : "Could not load reservations.")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hydrated, isAuthenticated, accessToken, isAdmin])

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in to see your reservations</CardTitle>
          <CardDescription>
            Your booking history is tied to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isAdmin) {
    return (
      <p className="text-sm text-muted-foreground">
        Admin accounts use the admin console for reservation data.
      </p>
    )
  }

  const sorted =
    rows == null
      ? []
      : [...rows].sort(
          (a, b) =>
            new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        )

  return (
    <>
      <p className="text-xs text-muted-foreground">
        Schedule times follow your browser locale; bookings are stored in{" "}
        <span className="font-mono">{LIBRARY_TIMEZONE}</span> for opening rules
        (9:00–18:00).
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="text-right">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows == null ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  Loading reservations…
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No reservations yet.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.id}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    #{r.table_number}
                  </TableCell>
                  <TableCell className="max-w-[260px] text-muted-foreground">
                    {formatRange(r.start_time, r.end_time)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.duration_minutes}m
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
