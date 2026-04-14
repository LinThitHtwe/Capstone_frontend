"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  apiMeCreateReservation,
  apiMeListReservations,
  apiPublicListTables,
  apiPublicTableWeightAvailability,
  type PublicTable,
  type UserReservation,
} from "@/lib/api"
import {
  LIBRARY_TIMEZONE,
  RESERVATION_MAX_MINUTES_PER_DAY,
  durationMinutes,
  endsAfterStart,
  libraryYmdFromInstant,
  libraryYmdFromReservationStart,
  suggestedEndAfterStart,
  suggestedStartForDate,
  startSlotOptions,
} from "@/lib/library-reservation-time"

type Props = {
  initialTableNumber: number | null
}

function minutesUsedOnLibraryDay(
  list: UserReservation[],
  ymd: string
): number {
  let sum = 0
  for (const r of list) {
    if (libraryYmdFromReservationStart(r.start_time) === ymd) {
      sum += r.duration_minutes
    }
  }
  return sum
}

export function ReserveTableForm({ initialTableNumber }: Props) {
  const router = useRouter()
  const { accessToken, isAuthenticated, isAdmin, hydrated } = useAuth()
  const [tables, setTables] = React.useState<PublicTable[] | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [myReservations, setMyReservations] = React.useState<UserReservation[]>([])
  const [reservationDate, setReservationDate] = React.useState(() =>
    libraryYmdFromInstant()
  )
  const [startLocal, setStartLocal] = React.useState("09:00")
  const [endLocal, setEndLocal] = React.useState("10:00")
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [successId, setSuccessId] = React.useState<number | null>(null)
  /** ST1 + linked weight sensor: live “current booking ends at” from API (OLED uses same). */
  const [st1WeightEndsLocal, setSt1WeightEndsLocal] = React.useState<string | null>(null)
  const [st1WeightAvailError, setSt1WeightAvailError] = React.useState<string | null>(null)

  const selectedTable = React.useMemo(() => {
    if (initialTableNumber == null || !tables) return null
    return (
      tables.find(
        (t) => t.table_number === initialTableNumber && t.is_reservable
      ) ?? null
    )
  }, [initialTableNumber, tables])

  const showSt1WeightAvailability =
    selectedTable != null &&
    selectedTable.table_number === 1 &&
    selectedTable.sensor_seated != null

  React.useEffect(() => {
    if (!showSt1WeightAvailability) {
      setSt1WeightEndsLocal(null)
      setSt1WeightAvailError(null)
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const a = await apiPublicTableWeightAvailability(1)
        if (cancelled) return
        setSt1WeightAvailError(null)
        setSt1WeightEndsLocal(a.current_booking_ends_local)
      } catch (e) {
        if (!cancelled) {
          setSt1WeightEndsLocal(null)
          setSt1WeightAvailError(
            e instanceof Error ? e.message : "Could not load table availability."
          )
        }
      }
    }
    void load()
    const id = window.setInterval(() => void load(), 45_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [showSt1WeightAvailability])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const t = await apiPublicListTables()
        if (!cancelled) setTables(t)
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load tables.")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    if (!hydrated || !isAuthenticated || !accessToken || isAdmin) return
    let cancelled = false
    ;(async () => {
      try {
        const list = await apiMeListReservations(accessToken)
        if (!cancelled) setMyReservations(list)
      } catch {
        if (!cancelled) setMyReservations([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hydrated, isAuthenticated, accessToken, isAdmin])

  React.useEffect(() => {
    const s = suggestedStartForDate(reservationDate)
    setStartLocal(s)
    setEndLocal(suggestedEndAfterStart(s))
  }, [reservationDate])

  const usedToday = minutesUsedOnLibraryDay(myReservations, reservationDate)
  const newDuration = durationMinutes(startLocal, endLocal)
  const remainingAfter =
    Number.isFinite(newDuration) && newDuration > 0
      ? RESERVATION_MAX_MINUTES_PER_DAY - usedToday - newDuration
      : RESERVATION_MAX_MINUTES_PER_DAY - usedToday

  const endChoices = React.useMemo(() => endsAfterStart(startLocal), [startLocal])

  React.useEffect(() => {
    if (!endChoices.includes(endLocal)) {
      const next = endChoices[0]
      if (next) setEndLocal(next)
    }
  }, [startLocal, endLocal, endChoices])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSuccessId(null)
    if (!accessToken || !selectedTable) return
    if (newDuration <= 0) {
      setFormError("End time must be after start time.")
      return
    }
    if (usedToday + newDuration > RESERVATION_MAX_MINUTES_PER_DAY) {
      setFormError(
        `You can book at most 4 hours per day. You already have ${usedToday} minutes on that date.`
      )
      return
    }
    setSubmitting(true)
    try {
      const created = await apiMeCreateReservation(accessToken, {
        table_id: selectedTable.id,
        reservation_date: reservationDate,
        start_local: startLocal,
        end_local: endLocal,
      })
      setSuccessId(created.id)
      const list = await apiMeListReservations(accessToken)
      setMyReservations(list)
      if (
        selectedTable.table_number === 1 &&
        selectedTable.sensor_seated != null
      ) {
        try {
          const a = await apiPublicTableWeightAvailability(1)
          setSt1WeightEndsLocal(a.current_booking_ends_local)
          setSt1WeightAvailError(null)
        } catch {
          /* keep prior hint */
        }
      }
      router.refresh()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Booking failed.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!hydrated) {
    return (
      <p className="text-sm text-muted-foreground">Loading session…</p>
    )
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>
            Log in with a student, staff, lecturer, or visitor account to book a
            table.
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
      <Card>
        <CardHeader>
          <CardTitle>Not available</CardTitle>
          <CardDescription>
            Admin accounts cannot use the public reservation API. Use the admin
            console to manage bookings.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (loadError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {loadError}
      </p>
    )
  }

  if (initialTableNumber == null) {
    return (
      <p className="text-sm text-muted-foreground">
        No table was selected. Open the{" "}
        <Link href="/" className="font-medium text-foreground underline">
          library map
        </Link>
        , click a reservable table, and confirm in the dialog.
      </p>
    )
  }

  if (tables && !selectedTable) {
    return (
      <p className="text-sm text-muted-foreground">
        Table #{initialTableNumber} was not found or is not reservable. Choose
        another table from the{" "}
        <Link href="/" className="font-medium text-foreground underline">
          map
        </Link>
        .
      </p>
    )
  }

  const todayLib = libraryYmdFromInstant()

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Table</CardTitle>
          <CardDescription>
            Reserving table{" "}
            <span className="font-semibold tabular-nums text-foreground">
              #{initialTableNumber}
            </span>
            {selectedTable ? (
              <span className="text-muted-foreground">
                {" "}
                · Floor {selectedTable.library_floor} · {selectedTable.table_type}
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Hours are{" "}
            <span className="font-medium text-foreground">9:00–18:00</span> in{" "}
            <span className="font-mono">{LIBRARY_TIMEZONE}</span>, in{" "}
            <span className="font-medium text-foreground">30-minute</span> slots.
            Each account may hold at most{" "}
            <span className="font-medium text-foreground">4 hours</span> of active
            bookings per calendar day in that timezone.
          </p>

          {showSt1WeightAvailability ? (
            <div
              className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-sm"
              role="status"
            >
              <p className="font-medium text-foreground">Table ST1 (weight sensor)</p>
              {st1WeightAvailError ? (
                <p className="mt-1 text-destructive">{st1WeightAvailError}</p>
              ) : st1WeightEndsLocal ? (
                <p className="mt-1 text-muted-foreground">
                  If someone is seated under a booking right now, that slot ends at{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {st1WeightEndsLocal}
                  </span>{" "}
                  ({LIBRARY_TIMEZONE}). The display at the table uses the same value.
                </p>
              ) : (
                <p className="mt-1 text-muted-foreground">
                  No reservation is active on this table at the moment (library clock). If
                  the table still shows occupied, it may be walk-in seating without a
                  booking end time.
                </p>
              )}
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="reservation-date">Date</Label>
            <input
              id="reservation-date"
              type="date"
              required
              min={todayLib}
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={reservationDate}
              onChange={(e) => setReservationDate(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="start-local">Start</Label>
              <select
                id="start-local"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={startLocal}
                onChange={(e) => {
                  const v = e.target.value
                  setStartLocal(v)
                  setEndLocal(suggestedEndAfterStart(v))
                }}
              >
                {startSlotOptions().map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-local">End</Label>
              <select
                id="end-local"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
              >
                {endChoices.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            This booking:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {Number.isFinite(newDuration) && newDuration > 0 ? newDuration : "—"}
            </span>{" "}
            minutes. Already booked that day:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {usedToday}
            </span>{" "}
            / {RESERVATION_MAX_MINUTES_PER_DAY} minutes. After this booking you
            would have{" "}
            <span
              className={
                remainingAfter < 0
                  ? "font-medium text-destructive"
                  : "font-medium tabular-nums text-foreground"
              }
            >
              {remainingAfter}
            </span>{" "}
            minutes left.
          </p>

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          {successId != null ? (
            <p className="text-sm text-green-700 dark:text-green-400" role="status">
              Reservation #{successId} created. See{" "}
              <Link href="/reservations" className="underline">
                My reservations
              </Link>
              .
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="submit"
              disabled={
                submitting ||
                !selectedTable ||
                remainingAfter < 0 ||
                newDuration <= 0
              }
            >
              {submitting ? "Submitting…" : "Submit reservation"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/">Back to map</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
