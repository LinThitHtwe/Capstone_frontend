"use client"

import * as React from "react"
import Link from "next/link"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { apiMeListReservations, type UserReservation } from "@/lib/api"

const PREVIEW_COUNT = 3

const reservationFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatReservationRange(start: string, end: string) {
  return `${reservationFormatter.format(new Date(start))} → ${reservationFormatter.format(new Date(end))}`
}

export function HomeReservationHistoryPreview() {
  const { accessToken, isAuthenticated, isAdmin, hydrated } = useAuth()
  const [rows, setRows] = React.useState<UserReservation[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!hydrated || !isAuthenticated || !accessToken || isAdmin) {
      setRows(null)
      setError(null)
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
      <div className="space-y-3 rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Log in to see your reservation history.
        </p>
        <Button asChild size="sm">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    )
  }

  if (isAdmin) {
    return (
      <p className="text-sm text-muted-foreground">
        Admin accounts manage reservations in the admin console.
      </p>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    )
  }

  if (rows == null) {
    return <p className="text-sm text-muted-foreground">Loading your reservations…</p>
  }

  const sorted = [...rows].sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  )
  const preview = sorted.slice(0, PREVIEW_COUNT)

  if (preview.length === 0) {
    return <p className="text-sm text-muted-foreground">No reservations yet.</p>
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {preview.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
        >
          <div className="font-medium tabular-nums">Table #{r.table_number}</div>
          <div className="text-muted-foreground">
            {formatReservationRange(r.start_time, r.end_time)}
          </div>
          <div className="w-full text-xs text-muted-foreground sm:w-auto">
            {r.duration_minutes} min
          </div>
        </li>
      ))}
    </ul>
  )
}
