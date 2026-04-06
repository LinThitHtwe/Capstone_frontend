import * as React from "react"
import { Circle, Square, Users } from "lucide-react"

import { cn } from "@/lib/utils"

const TILE_SHELL =
  "absolute select-none rounded-lg border-2 px-1.5 py-1 shadow-sm"

export type LibraryMapTableTileProps = {
  tableNumber: number
  tableType: string
  typeLabel: string
  positionStyle: React.CSSProperties
  title: string
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
}: {
  tableNumber: number
  tableType: string
  typeLabel: string
  subtextClassName: string
}) {
  const TypeIcon = tableTypeIcon(tableType)
  return (
    <>
      <div className="flex items-center justify-between gap-1">
        <span
          className={cn("font-mono text-[11px] leading-none", subtextClassName)}
        >
          #{tableNumber}
        </span>
        <TypeIcon
          className={cn("size-3.5 shrink-0", subtextClassName)}
          aria-hidden
        />
      </div>
      <div
        className={cn(
          "mt-0.5 truncate text-[11px] font-medium leading-tight",
          subtextClassName
        )}
      >
        {typeLabel}
      </div>
    </>
  )
}

/** Available — edit classes here only for this state. */
export function LibraryMapTableTileFree({
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
        "border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-950/45"
      )}
      style={positionStyle}
      title={title}
    >
      <LibraryMapTableTileContent
        tableNumber={tableNumber}
        tableType={tableType}
        typeLabel={typeLabel}
        subtextClassName="text-green-900/85 dark:text-green-50/90"
      />
    </div>
  )
}

/** Reserved — edit classes here only for this state. */
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
        "border-yellow-300 bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-950/40"
      )}
      style={positionStyle}
      title={title}
    >
      <LibraryMapTableTileContent
        tableNumber={tableNumber}
        tableType={tableType}
        typeLabel={typeLabel}
        subtextClassName="text-yellow-950/90 dark:text-yellow-50/90"
      />
    </div>
  )
}

/** Occupied — edit classes here only for this state. */
export function LibraryMapTableTileOccupied({
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
        "border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-950/45"
      )}
      style={positionStyle}
      title={title}
    >
      <LibraryMapTableTileContent
        tableNumber={tableNumber}
        tableType={tableType}
        typeLabel={typeLabel}
        subtextClassName="text-red-950/90 dark:text-red-50/90"
      />
    </div>
  )
}

/** Legend pill — matches free tile colours. */
export function LibraryMapLegendPillFree({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full border border-green-300 bg-green-100 px-2.5 py-1 text-xs font-medium text-green-950 dark:border-green-700 dark:bg-green-950/45 dark:text-green-50 sm:text-sm",
        className
      )}
    >
      Free
    </span>
  )
}

/** Legend pill — matches reserved tile colours. */
export function LibraryMapLegendPillReserved({
  className,
}: {
  className?: string
}) {
  return (
    <span
      className={cn(
        "rounded-full border border-yellow-300 bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-950 dark:border-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-50 sm:text-sm",
        className
      )}
    >
      Reserved
    </span>
  )
}

/** Legend pill — matches occupied tile colours. */
export function LibraryMapLegendPillOccupied({
  className,
}: {
  className?: string
}) {
  return (
    <span
      className={cn(
        "rounded-full border border-red-300 bg-red-100 px-2.5 py-1 text-xs font-medium text-red-950 dark:border-red-700 dark:bg-red-950/45 dark:text-red-50 sm:text-sm",
        className
      )}
    >
      Occupied
    </span>
  )
}
