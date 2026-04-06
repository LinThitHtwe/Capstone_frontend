"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Circle, Square, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  LIBRARY_MAP_STORAGE_KEY,
  LIBRARY_MAP_UPDATE_EVENT,
  libraryFloors,
  libraryMapSize,
  libraryTileSize,
  loadLibraryTablesFromLocalStorage,
  tableTypeLabel,
  type AdminTableRecord,
} from "@/lib/library-map"
import { mockReservations } from "@/lib/data/admin-mock"
import { getDemoStudentReservationsSorted } from "@/lib/data/demo-user-reservations"
import {
  getTableMapStatus,
  tableMapStatusClass,
  tableMapStatusLabel,
} from "@/lib/table-map-status"
import { cn } from "@/lib/utils"

const reservationFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatReservationRange(start: string, end: string) {
  return `${reservationFormatter.format(new Date(start))} → ${reservationFormatter.format(new Date(end))}`
}

function tableTypeIcon(type: string) {
  switch (type) {
    case "CIRCULAR":
      return Circle
    case "FOUR_SEATS":
      return Users
    case "SINGLE":
    default:
      return Square
  }
}

/** Seats counted per table type for “free seats” totals (library layout). */
const SEATS_PER_TABLE_TYPE = {
  SINGLE: 1,
  CIRCULAR: 2,
  FOUR_SEATS: 4,
} as const

export function PublicLibraryMap() {
  const [tables, setTables] = React.useState<AdminTableRecord[]>([])
  const [floor, setFloor] = React.useState<(typeof libraryFloors)[number]>(1)
  const [hydrated, setHydrated] = React.useState(false)
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const refresh = React.useCallback(() => {
    setTables(loadLibraryTablesFromLocalStorage())
  }, [])

  React.useEffect(() => {
    refresh()
    setHydrated(true)
  }, [refresh])

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === LIBRARY_MAP_STORAGE_KEY) refresh()
    }
    const onCustom = () => refresh()
    window.addEventListener("storage", onStorage)
    window.addEventListener(LIBRARY_MAP_UPDATE_EVENT, onCustom)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener(LIBRARY_MAP_UPDATE_EVENT, onCustom)
    }
  }, [refresh])

  const visibleTables = React.useMemo(
    () => tables.filter((t) => t.libraryFloor === floor),
    [tables, floor]
  )

  const availableByType = React.useMemo(() => {
    const c = { SINGLE: 0, CIRCULAR: 0, FOUR_SEATS: 0 }
    for (const t of visibleTables) {
      if (getTableMapStatus(t, mockReservations, now) !== "free") continue
      if (t.tableType === "CIRCULAR") c.CIRCULAR += 1
      else if (t.tableType === "FOUR_SEATS") c.FOUR_SEATS += 1
      else c.SINGLE += 1
    }
    return c
  }, [visibleTables, now])

  const freeTableCount =
    availableByType.SINGLE + availableByType.CIRCULAR + availableByType.FOUR_SEATS

  const freeSeatCount = React.useMemo(
    () =>
      availableByType.SINGLE * SEATS_PER_TABLE_TYPE.SINGLE +
      availableByType.CIRCULAR * SEATS_PER_TABLE_TYPE.CIRCULAR +
      availableByType.FOUR_SEATS * SEATS_PER_TABLE_TYPE.FOUR_SEATS,
    [availableByType]
  )

  const reservationPreview = React.useMemo(() => {
    return getDemoStudentReservationsSorted().slice(0, 3)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Library map</h1>
            <p className="text-sm text-muted-foreground">Tables by floor.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
        {!hydrated ? (
          <p className="text-sm text-muted-foreground">Loading map…</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Library top view</CardTitle>
              <CardDescription>Pick a floor to see tables on that level.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center rounded-lg border bg-background p-1 shadow-sm">
                    {libraryFloors.map((f) => {
                      const active = f === floor
                      return (
                        <Button
                          key={f}
                          type="button"
                          size="sm"
                          variant={active ? "default" : "ghost"}
                          onClick={() => setFloor(f)}
                          className={cn(
                            "h-8 rounded-md px-3",
                            !active && "text-muted-foreground"
                          )}
                        >
                          Floor {f}
                        </Button>
                      )
                    })}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Floor {floor}</span>
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {visibleTables.length} table
                  {visibleTables.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="mb-5 space-y-5">
                <div
                  className="overflow-hidden rounded-2xl border bg-card shadow-sm"
                  role="status"
                  aria-live="polite"
                  aria-label={`Floor ${floor}: ${freeSeatCount} free seats, ${freeTableCount} free tables`}
                >
                  <div className="flex gap-0 sm:gap-0">
                    <div
                      className={cn(
                        "w-1 shrink-0 sm:w-1.5",
                        freeSeatCount > 0 ? "bg-emerald-500" : "bg-muted-foreground/25"
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Availability · Floor {floor}
                          </p>
                          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0">
                            <span
                              className={cn(
                                "text-5xl font-bold tabular-nums tracking-tight sm:text-6xl",
                                freeSeatCount > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground"
                              )}
                            >
                              {freeSeatCount}
                            </span>
                            <span className="text-base font-medium text-muted-foreground sm:pb-1 sm:text-lg">
                              seats free right now
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end sm:text-right">
                          <div className="inline-flex items-baseline gap-1.5 rounded-full bg-muted/80 px-3 py-1 text-sm ring-1 ring-border/60">
                            <span className="tabular-nums text-lg font-semibold text-foreground">
                              {freeTableCount}
                            </span>
                            <span className="text-muted-foreground">
                              free table{freeTableCount === 1 ? "" : "s"}
                            </span>
                          </div>
                          <p className="max-w-[16rem] text-xs leading-snug text-muted-foreground sm:text-right">
                            Seat total uses{" "}
                            <span className="whitespace-nowrap font-medium text-foreground/90">
                              1 / {SEATS_PER_TABLE_TYPE.CIRCULAR} /{" "}
                              {SEATS_PER_TABLE_TYPE.FOUR_SEATS}
                            </span>{" "}
                            seats per single, circular, and 4-seat table.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/20 shadow-sm ring-1 ring-border/40">
                  <div className="grid grid-cols-3 divide-x divide-border/80">
                    <div className="flex flex-col items-center px-2 py-4 sm:px-4 sm:py-5">
                      <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border/70 sm:mb-3 sm:size-12">
                        <Square className="size-[18px] text-muted-foreground sm:size-5" aria-hidden />
                      </div>
                      <span className="text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
                        {availableByType.SINGLE}
                      </span>
                      <span className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
                        Single
                      </span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground/85 sm:text-xs">
                        1 seat · table
                      </span>
                    </div>
                    <div className="flex flex-col items-center px-2 py-4 sm:px-4 sm:py-5">
                      <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border/70 sm:mb-3 sm:size-12">
                        <Circle className="size-[18px] text-muted-foreground sm:size-5" aria-hidden />
                      </div>
                      <span className="text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
                        {availableByType.CIRCULAR}
                      </span>
                      <span className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
                        Circular
                      </span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground/85 sm:text-xs">
                        {SEATS_PER_TABLE_TYPE.CIRCULAR} seats · table
                      </span>
                    </div>
                    <div className="flex flex-col items-center px-2 py-4 sm:px-4 sm:py-5">
                      <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border/70 sm:mb-3 sm:size-12">
                        <Users className="size-[18px] text-muted-foreground sm:size-5" aria-hidden />
                      </div>
                      <span className="text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
                        {availableByType.FOUR_SEATS}
                      </span>
                      <span className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
                        4-seat
                      </span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground/85 sm:text-xs">
                        4 seats · table
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/15 px-3 py-2.5 sm:px-4">
                  <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Map colours
                  </span>
                  <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2 py-0.5 ring-1 ring-border/50">
                      <span
                        className="size-2 shrink-0 rounded-sm bg-emerald-500/90 ring-1 ring-emerald-600/35"
                        aria-hidden
                      />
                      Free
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2 py-0.5 ring-1 ring-border/50">
                      <span
                        className="size-2 shrink-0 rounded-sm bg-sky-500/85 ring-1 ring-sky-600/40"
                        aria-hidden
                      />
                      Reserved
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2 py-0.5 ring-1 ring-border/50">
                      <span
                        className="size-2 shrink-0 rounded-sm bg-orange-500/85 ring-1 ring-orange-600/40"
                        aria-hidden
                      />
                      Occupied
                    </span>
                  </div>
                </div>

                <div className="h-px bg-border" aria-hidden />
              </div>

              <div
                className="relative w-full overflow-hidden rounded-xl border bg-muted/20 aspect-[900/520]"
                role="img"
                aria-label={`Library map floor ${floor}`}
              >
                {visibleTables.map((t) => {
                  const TypeIcon = tableTypeIcon(t.tableType)
                  const status = getTableMapStatus(t, mockReservations, now)
                  const mapW = libraryMapSize.w
                  const mapH = libraryMapSize.h
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "absolute select-none rounded-lg border-2 px-1.5 py-1 shadow-sm",
                        tableMapStatusClass(status)
                      )}
                      style={{
                        left: `${(t.positionX / mapW) * 100}%`,
                        top: `${(t.positionY / mapH) * 100}%`,
                        width: `${(libraryTileSize.w / mapW) * 100}%`,
                        height: `${(libraryTileSize.h / mapH) * 100}%`,
                      }}
                      title={`${tableMapStatusLabel(status)} · ${tableTypeLabel(t.tableType)}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] leading-none text-muted-foreground">
                          #{t.tableNumber}
                        </span>
                        <TypeIcon
                          className="size-3.5 shrink-0 text-muted-foreground/80"
                          aria-hidden
                        />
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 truncate text-[11px] font-medium leading-tight",
                          t.tableType === "SINGLE" && "text-muted-foreground"
                        )}
                      >
                        {tableTypeLabel(t.tableType)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

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
