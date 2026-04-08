"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { LibraryMapExperienceCard } from "@/components/library/library-map-experience-card"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDemoStudentReservationsSorted } from "@/lib/data/demo-user-reservations"

const reservationFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatReservationRange(start: string, end: string) {
  return `${reservationFormatter.format(new Date(start))} → ${reservationFormatter.format(new Date(end))}`
}

export function PublicLibraryMap() {
  const reservationPreview = React.useMemo(() => {
    return getDemoStudentReservationsSorted().slice(0, 3)
  }, [])

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background md:min-h-[calc(100vh-4rem)]">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Library map</h1>
          <p className="text-sm text-muted-foreground">Tables by floor.</p>
        </div>
        <LibraryMapExperienceCard variant="public" />

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Your reservation history</CardTitle>
              <CardDescription>Newest three.</CardDescription>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/reservations">
                Full reservation history
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {reservationPreview.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reservations yet.</p>
            ) : (
              <ul className="divide-y rounded-xl border bg-card">
                {reservationPreview.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <div className="font-medium tabular-nums">Table #{r.tableNumber}</div>
                    <div className="text-muted-foreground">
                      {formatReservationRange(r.startTime, r.endTime)}
                    </div>
                    <div className="w-full text-xs text-muted-foreground sm:w-auto">
                      {r.durationMinutes} min
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
