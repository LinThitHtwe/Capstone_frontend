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

  const { free, reserved, occupied, freeSeats, total } = React.useMemo(() => {
    let free = 0
    let reserved = 0
    let occupied = 0
    let freeSeats = 0
    for (const t of tables) {
      const s = getTableMapStatus(t, mockReservations, now)
      if (s === "free") {
        free += 1
        freeSeats += seatCountForTable(t)
      } else if (s === "reserved") reserved += 1
      else occupied += 1
    }
    return { free, reserved, occupied, freeSeats, total: tables.length }
  }, [tables, now])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">Live library occupancy</CardTitle>
            <CardDescription>
              Same rules as the public map: free, reserved (active or upcoming
              48h), and unavailable tables.
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
        <div className="grid gap-3 sm:grid-cols-3">
          <div
            className={cn(
              "rounded-xl border px-4 py-3",
              "border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-950/45"
            )}
          >
            <p className="text-xs font-medium text-green-900 dark:text-green-100/90">
              {tableMapStatusLabel("free")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-green-950 dark:text-green-50">
              {free}
            </p>
            <p className="mt-0.5 text-xs text-green-900/80 dark:text-green-100/80">
              tables · {freeSeats} seats available
            </p>
          </div>
          <div
            className={cn(
              "rounded-xl border px-4 py-3",
              "border-yellow-300 bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-950/40"
            )}
          >
            <p className="text-xs font-medium text-yellow-950 dark:text-yellow-50/90">
              {tableMapStatusLabel("reserved")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-yellow-950 dark:text-yellow-50">
              {reserved}
            </p>
            <p className="mt-0.5 text-xs text-yellow-950/85 dark:text-yellow-50/80">
              tables
            </p>
          </div>
          <div
            className={cn(
              "rounded-xl border px-4 py-3",
              "border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-950/45"
            )}
          >
            <p className="text-xs font-medium text-red-950 dark:text-red-50/90">
              {tableMapStatusLabel("occupied")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-red-950 dark:text-red-50">
              {occupied}
            </p>
            <p className="mt-0.5 text-xs text-red-950/85 dark:text-red-50/80">
              unavailable
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
              aria-label={`Occupancy bar: ${free} free, ${reserved} reserved, ${occupied} occupied tables`}
            >
              {free > 0 ? (
                <div
                  className="h-full min-w-px bg-green-500 transition-all duration-300 dark:bg-green-600"
                  style={{ flex: free }}
                />
              ) : null}
              {reserved > 0 ? (
                <div
                  className="h-full min-w-px bg-yellow-400 transition-all duration-300 dark:bg-yellow-500"
                  style={{ flex: reserved }}
                />
              ) : null}
              {occupied > 0 ? (
                <div
                  className="h-full min-w-px bg-red-500 transition-all duration-300 dark:bg-red-600"
                  style={{ flex: occupied }}
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
