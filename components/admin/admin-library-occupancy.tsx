"use client"

import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { mockReservations } from "@/lib/data/admin-mock"
import { defaultAdminTables } from "@/lib/data/admin-tables-mock"
import {
  LIBRARY_MAP_STORAGE_KEY,
  LIBRARY_MAP_UPDATE_EVENT,
  loadLibraryTablesFromLocalStorage,
  type AdminTableRecord,
} from "@/lib/library-map"
import { resolveSensorSeated } from "@/lib/library-map-sensor-demo"
import { getTableMapStatus, tableMapStatusLabel } from "@/lib/table-map-status"
import { cn } from "@/lib/utils"

const SEATS_PER_TABLE_TYPE = {
  SINGLE: 1,
  CIRCULAR: 2,
  FOUR_SEATS: 4,
} as const

const clockFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

function seatCountForTable(t: AdminTableRecord): number {
  if (t.tableType === "CIRCULAR") return SEATS_PER_TABLE_TYPE.CIRCULAR
  if (t.tableType === "FOUR_SEATS") return SEATS_PER_TABLE_TYPE.FOUR_SEATS
  return SEATS_PER_TABLE_TYPE.SINGLE
}

export function AdminLibraryOccupancy() {
  const [tables, setTables] =
    React.useState<AdminTableRecord[]>(defaultAdminTables)
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const refresh = React.useCallback(() => {
    setTables(loadLibraryTablesFromLocalStorage())
  }, [])

  React.useEffect(() => {
    refresh()
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

  const { free, reserved, occupied, offline, freeSeats, total } = React.useMemo(() => {
    let free = 0
    let reserved = 0
    let occupied = 0
    let offline = 0
    let freeSeats = 0
    const tms = now.getTime()
    for (const t of tables) {
      const seated = resolveSensorSeated(
        t.sensorSeatedFromApi ?? null,
        t.tableNumber,
        t.libraryFloor,
        tms
      )
      const s = getTableMapStatus(t, mockReservations, now, seated)
      if (s === "free") {
        free += 1
        freeSeats += seatCountForTable(t)
      } else if (s === "reserved") reserved += 1
      else if (s === "offline") offline += 1
      else occupied += 1
    }
    return { free, reserved, occupied, offline, freeSeats, total: tables.length }
  }, [tables, now])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">Live library occupancy</CardTitle>
            <CardDescription>
              Matches the public map: bookings first, then seated (sensor or demo),
              then open tables. Grey tiles are unavailable.
            </CardDescription>
          </div>
          <p
            className="text-sm tabular-nums text-muted-foreground sm:text-right"
            aria-live="polite"
          >
            <span className="font-medium text-foreground">Now</span>{" "}
            {clockFormatter.format(now)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className={cn(
              "rounded-xl border px-4 py-3",
              "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/45"
            )}
          >
            <p className="text-xs font-medium text-emerald-950 dark:text-emerald-50/90">
              {tableMapStatusLabel("free")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-950 dark:text-emerald-50">
              {free}
            </p>
            <p className="mt-0.5 text-xs text-emerald-900/80 dark:text-emerald-100/80">
              tables · {freeSeats} seats
            </p>
          </div>
          <div
            className={cn(
              "rounded-xl border px-4 py-3",
              "border-amber-300 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40"
            )}
          >
            <p className="text-xs font-medium text-amber-950 dark:text-amber-50/90">
              {tableMapStatusLabel("reserved")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-amber-950 dark:text-amber-50">
              {reserved}
            </p>
            <p className="mt-0.5 text-xs text-amber-950/85 dark:text-amber-50/80">
              booking window
            </p>
          </div>
          <div
            className={cn(
              "rounded-xl border px-4 py-3",
              "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/45"
            )}
          >
            <p className="text-xs font-medium text-rose-950 dark:text-rose-50/90">
              {tableMapStatusLabel("occupied")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-rose-950 dark:text-rose-50">
              {occupied}
            </p>
            <p className="mt-0.5 text-xs text-rose-950/85 dark:text-rose-50/80">
              weight / demo
            </p>
          </div>
          <div
            className={cn(
              "rounded-xl border px-4 py-3",
              "border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900/70"
            )}
          >
            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-100/90">
              {tableMapStatusLabel("offline")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {offline}
            </p>
            <p className="mt-0.5 text-xs text-zinc-700/90 dark:text-zinc-200/80">
              out of service
            </p>
          </div>
        </div>

        {total > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Mix of {total} tables (all floors)
            </p>
            <div
              className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`Occupancy bar: ${free} open, ${reserved} reserved, ${occupied} seated, ${offline} unavailable tables`}
            >
              {free > 0 ? (
                <div
                  className="h-full min-w-px bg-emerald-500 transition-all duration-300 dark:bg-emerald-600"
                  style={{ flex: free }}
                />
              ) : null}
              {reserved > 0 ? (
                <div
                  className="h-full min-w-px bg-amber-400 transition-all duration-300 dark:bg-amber-500"
                  style={{ flex: reserved }}
                />
              ) : null}
              {occupied > 0 ? (
                <div
                  className="h-full min-w-px bg-rose-500 transition-all duration-300 dark:bg-rose-600"
                  style={{ flex: occupied }}
                />
              ) : null}
              {offline > 0 ? (
                <div
                  className="h-full min-w-px bg-zinc-400 transition-all duration-300 dark:bg-zinc-500"
                  style={{ flex: offline }}
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
