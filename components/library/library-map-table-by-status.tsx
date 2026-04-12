import * as React from "react"
import {
  Armchair,
  Ban,
  CalendarDays,
  Circle,
  Lock,
  Square,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"

const TILE_SHELL =
  "absolute flex select-none flex-col rounded-lg border-2 px-1 py-0.5 shadow-sm"

export type LibraryMapTableTileProps = {
  tableNumber: number
  tableType: string
  typeLabel: string
  positionStyle: React.CSSProperties
  title: string
  /** When set, tile is a button (only used for free tables). */
  onActivate?: () => void
  /**
   * Free tables only: `false` means the seat is free but not open for online reservation
   * (distinct look from reservable green tiles).
   */
  isReservable?: boolean
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

function LibraryMapTableTileContent({
  tableNumber,
  tableType,
  typeLabel,
  subtextClassName,
  showNoBookingHint,
  statusLine,
  statusIcon: StatusIcon,
}: {
  tableNumber: number
  tableType: string
  typeLabel: string
  subtextClassName: string
  showNoBookingHint?: boolean
  statusLine: string
  statusIcon?: React.ComponentType<{ className?: string }>
}) {
  const TypeIcon = tableTypeIcon(tableType)
  return (
    <>
      <div className="flex items-center justify-between gap-0.5">
        <span
          className={cn(
            "flex min-w-0 items-center gap-0.5 font-mono text-[10px] leading-none",
            subtextClassName
          )}
        >
          #{tableNumber}
          {showNoBookingHint ? (
            <Lock className="size-2.5 shrink-0 opacity-80" aria-hidden />
          ) : null}
        </span>
        <div className="flex shrink-0 items-center gap-0.5" aria-hidden>
          {StatusIcon ? (
            <StatusIcon className={cn("size-3", subtextClassName)} />
          ) : null}
          <TypeIcon className={cn("size-3", subtextClassName)} />
        </div>
      </div>
      <div
        className={cn(
          "truncate text-[10px] font-medium leading-tight",
          subtextClassName
        )}
        title={showNoBookingHint ? "Not open for online reservation" : undefined}
      >
        {typeLabel}
      </div>
      <div
        className={cn(
          "mt-0.5 truncate text-[9px] font-semibold uppercase tracking-wide",
          subtextClassName,
          "opacity-90"
        )}
      >
        {statusLine}
      </div>
    </>
  )
}

/** Open + bookable online */
export function LibraryMapTableTileFree({
  tableNumber,
  tableType,
  typeLabel,
  positionStyle,
  title,
  onActivate,
  isReservable = true,
}: LibraryMapTableTileProps) {
  const reservable = isReservable !== false
  const canReserve = Boolean(onActivate && reservable)

  const shellClass = cn(
    TILE_SHELL,
    reservable
      ? "border-emerald-400/90 bg-gradient-to-b from-emerald-50 to-emerald-100/90 dark:border-emerald-600 dark:from-emerald-950/50 dark:to-emerald-950/80"
      : "border-dashed border-slate-400 bg-slate-50 dark:border-slate-500 dark:bg-slate-950/55",
    canReserve &&
      "cursor-pointer transition hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:brightness-[0.94]"
  )

  const inner = (
    <LibraryMapTableTileContent
      tableNumber={tableNumber}
      tableType={tableType}
      typeLabel={typeLabel}
      subtextClassName={
        reservable
          ? "text-emerald-950/90 dark:text-emerald-50/95"
          : "text-slate-800 dark:text-slate-100/90"
      }
      showNoBookingHint={!reservable}
      statusLine={reservable ? "Open · reserve" : "Open · walk-in"}
    />
  )

  if (canReserve) {
    return (
      <button
        type="button"
        className={cn(shellClass, "text-left font-sans")}
        style={positionStyle}
        title={title}
        aria-label={`${title}. Click to reserve this table.`}
        onClick={onActivate}
      >
        {inner}
      </button>
    )
  }

  return (
    <div
      className={shellClass}
      style={positionStyle}
      title={title}
      role="group"
      aria-label={title}
    >
      {inner}
    </div>
  )
}

/** Active or upcoming booking */
export function LibraryMapTableTileReserved({
  tableNumber,
  tableType,
  typeLabel,
  positionStyle,
  title,
}: LibraryMapTableTileProps) {
  return (
    <div
      className={cn(
        TILE_SHELL,
        "cursor-default border-amber-400/95 bg-gradient-to-b from-amber-50 to-amber-100/95 dark:border-amber-600 dark:from-amber-950/55 dark:to-amber-950/85"
      )}
      style={positionStyle}
      title={title}
      aria-label={title}
    >
      <LibraryMapTableTileContent
        tableNumber={tableNumber}
        tableType={tableType}
        typeLabel={typeLabel}
        subtextClassName="text-amber-950/95 dark:text-amber-50/95"
        statusLine="Reserved"
        statusIcon={CalendarDays}
      />
    </div>
  )
}

export type LibraryMapTableTileOccupiedProps = LibraryMapTableTileProps & {
  /** When no sensor is linked, seating is simulated for the demo. */
  occupancyDemo?: boolean
}

/** Someone seated (weight sensor); demo when no hardware yet. */
export function LibraryMapTableTileOccupied({
  tableNumber,
  tableType,
  typeLabel,
  positionStyle,
  title,
  occupancyDemo = false,
}: LibraryMapTableTileOccupiedProps) {
  return (
    <div
      className={cn(
        TILE_SHELL,
        "cursor-default border-rose-400/90 bg-gradient-to-b from-rose-50 to-rose-100/90 dark:border-rose-600 dark:from-rose-950/50 dark:to-rose-950/85"
      )}
      style={positionStyle}
      title={title}
      aria-label={title}
    >
      <LibraryMapTableTileContent
        tableNumber={tableNumber}
        tableType={tableType}
        typeLabel={typeLabel}
        subtextClassName="text-rose-950/95 dark:text-rose-50/95"
        statusLine={occupancyDemo ? "Seated · demo" : "Seated"}
        statusIcon={Armchair}
      />
    </div>
  )
}

/** Table out of service / maintenance */
export function LibraryMapTableTileOffline({
  tableNumber,
  tableType,
  typeLabel,
  positionStyle,
  title,
}: LibraryMapTableTileProps) {
  return (
    <div
      className={cn(
        TILE_SHELL,
        "cursor-default border-zinc-400/80 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900/70"
      )}
      style={positionStyle}
      title={title}
      aria-label={title}
    >
      <LibraryMapTableTileContent
        tableNumber={tableNumber}
        tableType={tableType}
        typeLabel={typeLabel}
        subtextClassName="text-zinc-700 dark:text-zinc-200/90"
        statusLine="Unavailable"
        statusIcon={Ban}
      />
    </div>
  )
}

/** Legend — open + reservable */
export function LibraryMapLegendPillFree({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full border border-emerald-400/90 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-50 sm:text-sm",
        className
      )}
    >
      Open · reservable
    </span>
  )
}

/** Legend — open, walk-in only */
export function LibraryMapLegendPillFreeNoBooking({
  className,
}: {
  className?: string
}) {
  return (
    <span
      className={cn(
        "rounded-full border border-dashed border-slate-400 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 dark:border-slate-500 dark:bg-slate-950/55 dark:text-slate-100 sm:text-sm",
        className
      )}
    >
      Open · no booking
    </span>
  )
}

export function LibraryMapLegendPillReserved({
  className,
}: {
  className?: string
}) {
  return (
    <span
      className={cn(
        "rounded-full border border-amber-400/95 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-950 dark:border-amber-600 dark:bg-amber-950/55 dark:text-amber-50 sm:text-sm",
        className
      )}
    >
      Reserved
    </span>
  )
}

export function LibraryMapLegendPillOccupied({
  className,
}: {
  className?: string
}) {
  return (
    <span
      className={cn(
        "rounded-full border border-rose-400/90 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-950 dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-50 sm:text-sm",
        className
      )}
    >
      Seated (sensor)
    </span>
  )
}

export function LibraryMapLegendPillOffline({
  className,
}: {
  className?: string
}) {
  return (
    <span
      className={cn(
        "rounded-full border border-zinc-400/80 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900/70 dark:text-zinc-100 sm:text-sm",
        className
      )}
    >
      Unavailable
    </span>
  )
}
