"use client"

import * as React from "react"
import { ChevronsLeftRight, DoorOpen } from "lucide-react"

import { libraryMapSize } from "@/lib/library-map"
import { cn } from "@/lib/utils"

type LibraryMapPannableViewportProps = {
  children: React.ReactNode
  className?: string
  "aria-label"?: string
  /** Shown when the map overflows horizontally (default). */
  overflowHintText?: string
  /** Forwarded to the scroll container (e.g. admin table drag move/up). */
  onScrollAreaPointerMove?: React.PointerEventHandler<HTMLDivElement>
  onScrollAreaPointerUp?: React.PointerEventHandler<HTMLDivElement>
  onScrollAreaPointerCancel?: React.PointerEventHandler<HTMLDivElement>
}

function isPanExemptTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest("button, [role='button'], [data-skip-map-pan]")
  )
}

/**
 * Map frame: inner surface is fixed library pixels (900×wide × full height).
 * Height matches the map so there is no vertical in-frame scroll — only horizontal
 * scroll / drag-pan. Skips pan for `button`, `[role="button"]`, `[data-skip-map-pan]`.
 */
export function LibraryMapPannableViewport({
  children,
  className,
  "aria-label": ariaLabel,
  overflowHintText = "Scroll or drag sideways to pan",
  onScrollAreaPointerMove,
  onScrollAreaPointerUp,
  onScrollAreaPointerCancel,
}: LibraryMapPannableViewportProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const dragRef = React.useRef({
    active: false,
    pointerId: -1,
    x: 0,
  })
  const [panning, setPanning] = React.useState(false)
  const [edges, setEdges] = React.useState({ left: false, right: false })
  const [hasOverflow, setHasOverflow] = React.useState(false)

  const mapH = libraryMapSize.h

  const updateScrollIndicators = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, clientWidth, scrollWidth } = el
    const eps = 3
    const overflowX = scrollWidth > clientWidth + eps
    setHasOverflow(overflowX)
    setEdges({
      left: overflowX && scrollLeft > eps,
      right: overflowX && scrollLeft + clientWidth < scrollWidth - eps,
    })
  }, [])

  React.useLayoutEffect(() => {
    updateScrollIndicators()
    const el = scrollRef.current
    if (!el) return

    el.addEventListener("scroll", updateScrollIndicators, { passive: true })
    const ro = new ResizeObserver(updateScrollIndicators)
    ro.observe(el)

    return () => {
      el.removeEventListener("scroll", updateScrollIndicators)
      ro.disconnect()
    }
  }, [updateScrollIndicators])

  const endPan = React.useCallback((pointerId?: number) => {
    const d = dragRef.current
    if (!d.active) return
    d.active = false
    setPanning(false)
    const node = scrollRef.current
    if (
      pointerId != null &&
      node?.hasPointerCapture?.(pointerId)
    ) {
      node.releasePointerCapture(pointerId)
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    if (isPanExemptTarget(e.target)) return

    const node = scrollRef.current
    if (!node) return

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      x: e.clientX,
    }
    setPanning(true)
    node.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onScrollAreaPointerMove?.(e)
    const d = dragRef.current
    if (!d.active || e.pointerId !== d.pointerId) return
    const node = scrollRef.current
    if (!node) return

    const dx = e.clientX - d.x
    d.x = e.clientX
    node.scrollLeft -= dx
    updateScrollIndicators()
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    onScrollAreaPointerUp?.(e)
    if (dragRef.current.pointerId === e.pointerId) {
      endPan(e.pointerId)
    }
  }

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    onScrollAreaPointerCancel?.(e)
    if (dragRef.current.pointerId === e.pointerId) {
      endPan(e.pointerId)
    }
  }

  React.useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    const onLost = () => endPan()
    node.addEventListener("lostpointercapture", onLost)
    return () => node.removeEventListener("lostpointercapture", onLost)
  }, [endPan])

  return (
    <div className="relative w-full max-w-full">
      <div
        ref={scrollRef}
        role="region"
        aria-label={ariaLabel}
        className={cn(
          "w-full overflow-x-auto overflow-y-hidden rounded-xl border bg-muted/20",
          "overscroll-x-contain [scrollbar-width:thin]",
          "cursor-grab",
          panning && "cursor-grabbing select-none",
          className
        )}
        style={{
          height: mapH,
          touchAction: panning ? "none" : "pan-x",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div
          className="relative shrink-0"
          style={{
            width: libraryMapSize.w,
            height: libraryMapSize.h,
          }}
        >
          {children}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] flex flex-col items-center justify-end border-t border-dashed border-primary/35 bg-gradient-to-t from-background/95 via-background/80 to-transparent pb-1.5 pt-4"
            role="note"
          >
            <span className="sr-only">
              Map orientation: the bottom edge of this floor plan is the library
              entrance. Use it to tell front from back when choosing a table.
            </span>
            <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/90 px-2.5 py-1 shadow-sm ring-1 ring-border/40">
              <DoorOpen
                className="size-3.5 shrink-0 text-primary"
                aria-hidden
              />
              <span className="text-[11px] font-semibold tracking-tight text-foreground sm:text-xs">
                Entrance
              </span>
              <span className="hidden text-[10px] text-muted-foreground sm:inline">
                · bottom of map
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        aria-hidden
      >
        {edges.left ? (
          <div className="absolute inset-y-0 left-0 z-[1] w-10 bg-gradient-to-r from-background/95 via-background/45 to-transparent" />
        ) : null}
        {edges.right ? (
          <div className="absolute inset-y-0 right-0 z-[1] w-10 bg-gradient-to-l from-background/95 via-background/45 to-transparent" />
        ) : null}
      </div>

      {hasOverflow ? (
        <div
          className="pointer-events-none absolute right-2 top-2 z-[2] flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-md border border-border/80 bg-background/95 px-2 py-1 text-[10px] font-medium leading-tight text-muted-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:right-3 sm:top-3 sm:max-w-none sm:text-xs"
          role="status"
        >
          <ChevronsLeftRight className="size-3.5 shrink-0 opacity-80" aria-hidden />
          <span>{overflowHintText}</span>
        </div>
      ) : null}
    </div>
  )
}
