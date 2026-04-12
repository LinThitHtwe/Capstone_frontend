"use client"

import * as React from "react"
import { ArrowUp, ChevronsLeftRight, DoorOpen } from "lucide-react"

import { libraryMapSize } from "@/lib/library-map"
import { cn } from "@/lib/utils"

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export type LibraryMapViewportHandle = {
  /** Map coordinates (same space as table `positionX` / `positionY`). */
  clientToWorld: (clientX: number, clientY: number) => { x: number; y: number }
  /**
   * During tile drag: nudge horizontal pan when the pointer is near the viewport edge,
   * then return the world point. Pan and coordinates stay in sync (no scrollLeft).
   */
  worldPointWithDragAutoscroll: (
    clientX: number,
    clientY: number
  ) => { x: number; y: number }
}

type LibraryMapPannableViewportProps = {
  children: React.ReactNode
  className?: string
  "aria-label"?: string
  overflowHintText?: string
}

function isPanExemptTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest("button, [role='button'], [data-skip-map-pan]")
  )
}

const mapW = libraryMapSize.w
const mapH = libraryMapSize.h

/**
 * Horizontal pan uses CSS transform (not overflow scroll) so map coordinates are always
 * `world = viewportLocal + panX` and tile dragging cannot desync from the viewport.
 */
export const LibraryMapPannableViewport = React.forwardRef<
  LibraryMapViewportHandle,
  LibraryMapPannableViewportProps
>(function LibraryMapPannableViewport(
  {
    children,
    className,
    "aria-label": ariaLabel,
    overflowHintText = "Scroll or drag sideways to pan",
  },
  ref
) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const viewportWRef = React.useRef(0)
  const panXRef = React.useRef(0)
  const [panX, setPanX] = React.useState(0)

  const dragRef = React.useRef({
    active: false,
    pointerId: -1,
    x: 0,
  })
  const [panning, setPanning] = React.useState(false)
  const [edges, setEdges] = React.useState({ left: false, right: false })
  const [hasOverflow, setHasOverflow] = React.useState(false)

  const maxPanX = React.useCallback(() => {
    const vw = viewportWRef.current
    return Math.max(0, mapW - vw)
  }, [])

  const setPanClamped = React.useCallback((next: number) => {
    const max = maxPanX()
    const px = clamp(next, 0, max)
    panXRef.current = px
    setPanX(px)
  }, [maxPanX])

  const readWorld = React.useCallback((clientX: number, clientY: number) => {
    const vp = viewportRef.current
    if (!vp) return { x: 0, y: 0 }
    const rect = vp.getBoundingClientRect()
    const lx = clientX - rect.left
    const ly = clientY - rect.top
    return { x: lx + panXRef.current, y: ly }
  }, [])

  const autoscrollThenWorld = React.useCallback(
    (clientX: number, clientY: number) => {
      const vp = viewportRef.current
      if (!vp) return { x: 0, y: 0 }
      const rect = vp.getBoundingClientRect()
      const zone = 80
      let px = panXRef.current
      const max = maxPanX()
      const cx = clientX
      if (cx > rect.right - zone) {
        const over = cx - (rect.right - zone)
        px += Math.min(72, 10 + over * 0.55)
      } else if (cx < rect.left + zone) {
        const over = rect.left + zone - cx
        px -= Math.min(72, 10 + over * 0.55)
      }
      px = clamp(px, 0, max)
      if (px !== panXRef.current) {
        panXRef.current = px
        setPanX(px)
      }
      const lx = clientX - rect.left
      const ly = clientY - rect.top
      return { x: lx + panXRef.current, y: ly }
    },
    [maxPanX]
  )

  React.useImperativeHandle(
    ref,
    () => ({
      clientToWorld: readWorld,
      worldPointWithDragAutoscroll: autoscrollThenWorld,
    }),
    [readWorld, autoscrollThenWorld]
  )

  const updateEdges = React.useCallback(() => {
    const max = maxPanX()
    const eps = 2
    const overflowX = max > eps
    const px = panXRef.current
    setHasOverflow(overflowX)
    setEdges({
      left: overflowX && px > eps,
      right: overflowX && px < max - eps,
    })
  }, [maxPanX])

  React.useLayoutEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (cr) viewportWRef.current = cr.width
      const max = Math.max(0, mapW - viewportWRef.current)
      if (panXRef.current > max) {
        panXRef.current = max
        setPanX(max)
      }
      updateEdges()
    })
    ro.observe(vp)
    viewportWRef.current = vp.getBoundingClientRect().width
    updateEdges()
    return () => ro.disconnect()
  }, [updateEdges])

  React.useLayoutEffect(() => {
    updateEdges()
  }, [panX, updateEdges])

  const endPan = React.useCallback((pointerId?: number) => {
    const d = dragRef.current
    if (!d.active) return
    d.active = false
    setPanning(false)
    const node = viewportRef.current
    if (pointerId != null && node?.hasPointerCapture?.(pointerId)) {
      node.releasePointerCapture(pointerId)
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    if (isPanExemptTarget(e.target)) return

    const node = viewportRef.current
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
    const d = dragRef.current
    if (!d.active || e.pointerId !== d.pointerId) return

    const dx = e.clientX - d.x
    d.x = e.clientX
    setPanClamped(panXRef.current - dx)
    updateEdges()
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId === e.pointerId) {
      endPan(e.pointerId)
    }
  }

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId === e.pointerId) {
      endPan(e.pointerId)
    }
  }

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta =
      e.deltaX !== 0
        ? e.deltaX
        : e.shiftKey
          ? e.deltaY
          : 0
    if (delta === 0) return
    e.preventDefault()
    setPanClamped(panXRef.current + delta)
    updateEdges()
  }

  React.useEffect(() => {
    const node = viewportRef.current
    if (!node) return
    const onLost = () => endPan()
    node.addEventListener("lostpointercapture", onLost)
    return () => node.removeEventListener("lostpointercapture", onLost)
  }, [endPan])

  return (
    <div className="relative w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-muted/20 shadow-sm">
      <div
        ref={viewportRef}
        role="region"
        aria-label={ariaLabel}
        className={cn(
          "min-w-0 w-full cursor-grab overflow-hidden",
          panning && "cursor-grabbing select-none",
          className
        )}
        style={{
          height: mapH,
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onWheel={onWheel}
      >
        <div
          className="relative will-change-transform"
          style={{
            width: mapW,
            height: mapH,
            transform: `translate3d(${-panX}px, 0, 0)`,
          }}
        >
          {children}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6]">
        <span className="sr-only">
          Map orientation: the bottom edge of this floor plan is the library
          entrance.
        </span>
        <div className="h-14 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-2 flex items-center justify-center px-3">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-foreground px-3 py-1.5 text-background ring-1 ring-border/40 sm:gap-2.5 sm:px-3.5">
            <span
              className="flex shrink-0 items-center gap-0.5 rounded-full bg-background/10 px-2 py-1 ring-1 ring-background/10"
              aria-hidden
            >
              <DoorOpen className="size-4 text-background sm:size-[1.125rem]" />
              <ArrowUp className="size-3.5 text-background/90 sm:size-4" />
            </span>
            <span className="whitespace-nowrap text-[12px] font-semibold tracking-tight sm:text-sm">
              Library entrance
            </span>
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
})

LibraryMapPannableViewport.displayName = "LibraryMapPannableViewport"
