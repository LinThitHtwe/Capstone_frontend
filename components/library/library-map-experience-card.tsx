"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Circle, Square, Users } from "lucide-react"

import { LibraryMapPannableViewport } from "@/components/library/library-map-pannable-viewport"
import {
  LibraryMapLegendPillFree,
  LibraryMapLegendPillOccupied,
  LibraryMapLegendPillReserved,
  LibraryMapTableTileFree,
  LibraryMapTableTileOccupied,
  LibraryMapTableTileReserved,
} from "@/components/library/library-map-table-by-status"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  LIBRARY_MAP_STORAGE_KEY,
  LIBRARY_MAP_UPDATE_EVENT,
  libraryFloors,
  libraryTileSize,
  loadLibraryTablesFromLocalStorage,
  tableTypeLabel,
  type AdminTableRecord,
} from "@/lib/library-map"
import { mockReservations } from "@/lib/data/admin-mock"
import { getTableMapStatus, tableMapStatusLabel } from "@/lib/table-map-status"
import { cn } from "@/lib/utils"

const SEATS_PER_TABLE_TYPE = {
  SINGLE: 1,
  CIRCULAR: 2,
  FOUR_SEATS: 4,
} as const

export type LibraryMapExperienceCardProps = {
  variant: "public" | "admin"
  /** Overrides default card title for the variant */
  title?: string
  /** Overrides default card description */
  description?: string
}

export function LibraryMapExperienceCard({
  variant,
  title,
  description,
}: LibraryMapExperienceCardProps) {
  const router = useRouter()
  const allowReserve = variant === "public"

  const [tables, setTables] = React.useState<AdminTableRecord[]>([])
  const [floor, setFloor] = React.useState<(typeof libraryFloors)[number]>(1)
  const [hydrated, setHydrated] = React.useState(false)
  const [now, setNow] = React.useState(() => new Date())
  const [reservePromptTable, setReservePromptTable] = React.useState<
    number | null
  >(null)

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

  const cardTitle =
    title ??
    (variant === "admin"
      ? "Library map (student view)"
      : "Library top view")

  const cardDescription =
    description ??
    (variant === "admin"
      ? "Same live colours and layout as the public page. Edit positions under Tables."
      : "Pick a floor to see tables on that level.")

  const mapAria =
    variant === "public"
      ? `Library map floor ${floor}. Green tables are free to reserve. Drag empty areas horizontally to pan.`
      : `Library map floor ${floor}. Read-only preview. Drag empty areas horizontally to pan.`

  if (!hydrated) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading map…
      </p>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
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
                    freeSeatCount > 0 ? "bg-green-500" : "bg-muted-foreground/25"
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
                              ? "text-green-700 dark:text-green-400"
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
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <LibraryMapLegendPillFree />
                <LibraryMapLegendPillReserved />
                <LibraryMapLegendPillOccupied />
              </div>
            </div>

            <div className="h-px bg-border" aria-hidden />
          </div>

          <LibraryMapPannableViewport aria-label={mapAria}>
            {visibleTables.map((t) => {
              const status = getTableMapStatus(t, mockReservations, now)
              const positionStyle: React.CSSProperties = {
                left: t.positionX,
                top: t.positionY,
                width: libraryTileSize.w,
                height: libraryTileSize.h,
              }
              const tileProps = {
                tableNumber: t.tableNumber,
                tableType: t.tableType,
                typeLabel: tableTypeLabel(t.tableType),
                positionStyle,
                title: `${tableMapStatusLabel(status)} · ${tableTypeLabel(t.tableType)}`,
              }
              switch (status) {
                case "free":
                  return (
                    <LibraryMapTableTileFree
                      key={t.id}
                      {...tileProps}
                      onActivate={
                        allowReserve
                          ? () => setReservePromptTable(t.tableNumber)
                          : undefined
                      }
                    />
                  )
                case "reserved":
                  return (
                    <LibraryMapTableTileReserved key={t.id} {...tileProps} />
                  )
                case "occupied":
                  return (
                    <LibraryMapTableTileOccupied key={t.id} {...tileProps} />
                  )
              }
            })}
          </LibraryMapPannableViewport>
          <p className="mt-2 text-xs text-muted-foreground">
            {allowReserve ? (
              "Green tables are free — tap or click to reserve."
            ) : (
              <>
                Preview only — scroll or drag sideways on the map. Same view as the public
                home page.{" "}
                <Link
                  href="/admin/tables"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Edit layout on Tables
                </Link>
                .
              </>
            )}
          </p>
        </CardContent>
      </Card>

      {allowReserve ? (
        <Dialog
          open={reservePromptTable !== null}
          onOpenChange={(open) => {
            if (!open) setReservePromptTable(null)
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reserve this table?</DialogTitle>
              <DialogDescription>
                {reservePromptTable != null ? (
                  <>
                    Do you want to reserve table no.{" "}
                    <span className="font-semibold text-foreground">
                      {reservePromptTable}
                    </span>
                    ?
                  </>
                ) : null}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReservePromptTable(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const n = reservePromptTable
                  setReservePromptTable(null)
                  if (n != null) {
                    router.push(
                      `/reservations/reserve?table=${encodeURIComponent(String(n))}`
                    )
                  }
                }}
              >
                Yes, reserve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}
