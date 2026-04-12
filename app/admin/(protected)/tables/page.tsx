"use client"

import * as React from "react"
import Link from "next/link"

import {
  Circle,
  Lock,
  Monitor,
  Plus,
  Redo2,
  Save,
  Scale,
  Square,
  Trash2,
  Undo2,
  Users,
} from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import {
  LibraryMapPannableViewport,
  type LibraryMapViewportHandle,
} from "@/components/library/library-map-pannable-viewport"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  type AdminTableRecord,
  defaultAdminTables,
} from "@/lib/data/admin-tables-mock"
import {
  apiAdminCreateTable,
  apiAdminDeleteTable,
  apiAdminListLCDDisplays,
  apiAdminListTables,
  apiAdminListWeightSensors,
  apiAdminUpdateTable,
  type AdminLCDDisplay,
  type AdminTable,
  type AdminWeightSensor,
} from "@/lib/api"
import {
  LIBRARY_MAP_ADMIN_TABLES_VIEWPORT_WRAP_CLASSNAME,
  LIBRARY_MAP_STORAGE_KEY,
  LIBRARY_MAP_UPDATE_EVENT,
  libraryFloors as floors,
  libraryMapSize as mapSize,
  libraryTileSize as tileSize,
  tableTypeLabel,
} from "@/lib/library-map"
import { cn } from "@/lib/utils"

const grid = 10
const tableTypes = ["SINGLE", "CIRCULAR", "FOUR_SEATS"] as const

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

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function snap(n: number) {
  return Math.round(n / grid) * grid
}

/** Snap to grid, then clamp so the tile never extends past the map (snap can round past max). */
function snapPosition(n: number, min: number, max: number) {
  return clamp(snap(n), min, max)
}

function isOverlapping(
  tables: AdminTableRecord[],
  candidate: { id: string; floor: number; x: number; y: number }
) {
  const a = {
    left: candidate.x,
    top: candidate.y,
    right: candidate.x + tileSize.w,
    bottom: candidate.y + tileSize.h,
  }
  for (const t of tables) {
    if (t.id === candidate.id) continue
    if (t.libraryFloor !== candidate.floor) continue
    const b = {
      left: t.positionX,
      top: t.positionY,
      right: t.positionX + tileSize.w,
      bottom: t.positionY + tileSize.h,
    }
    const overlap =
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
    if (overlap) return true
  }
  return false
}

function loadTables(): AdminTableRecord[] {
  try {
    const raw = localStorage.getItem(LIBRARY_MAP_STORAGE_KEY)
    if (!raw) return defaultAdminTables
    const parsed = JSON.parse(raw) as AdminTableRecord[]
    if (!Array.isArray(parsed)) return defaultAdminTables
    return parsed.map((t) => ({
      ...t,
      weightSensorId: t.weightSensorId ?? null,
      lcdDisplayId: t.lcdDisplayId ?? null,
      lcdDisplayType: t.lcdDisplayType ?? null,
    }))
  } catch {
    return defaultAdminTables
  }
}

function saveTables(tables: AdminTableRecord[]) {
  try {
    localStorage.setItem(LIBRARY_MAP_STORAGE_KEY, JSON.stringify(tables))
  } catch {
    // ignore for demo
  }
}

function nextTableNumber(tables: AdminTableRecord[]) {
  const nums = new Set(tables.map((t) => t.tableNumber))
  let n = 1
  while (nums.has(n)) n += 1
  return n
}

function createTable(
  tables: AdminTableRecord[],
  floor: number
): AdminTableRecord {
  const n = nextTableNumber(tables)

  const startX = 40
  const startY = 40
  const step = grid * 2
  let x = startX
  let y = startY
  for (let i = 0; i < 500; i += 1) {
    const ok = !isOverlapping(tables, { id: "__new__", floor, x, y })
    if (ok) break
    x += step
    if (x > mapSize.w - tileSize.w) {
      x = startX
      y += step
    }
    if (y > mapSize.h - tileSize.h) {
      y = startY
    }
  }

  return {
    id: `tbl-${String(Date.now())}`,
    tableNumber: n,
    tableType: "SINGLE",
    libraryFloor: floor,
    positionX: x,
    positionY: y,
    isReservable: true,
    isAvailable: true,
    weightSensorId: null,
    lcdDisplayId: null,
  }
}

function isNumericId(id: string): boolean {
  return /^\d+$/.test(id)
}

function mapAdminApiTableToRecord(t: AdminTable): AdminTableRecord {
  return {
    id: String(t.id),
    tableNumber: t.table_number,
    tableType: t.table_type,
    libraryFloor: t.library_floor,
    positionX: t.position_x,
    positionY: t.position_y,
    isReservable: t.is_reservable,
    isAvailable: t.is_available,
    sensorSeatedFromApi: t.sensor_seated ?? null,
    weightSensorId: t.weight_sensor_id ?? null,
    lcdDisplayId: t.lcd_display?.id ?? null,
    lcdDisplayType: t.lcd_display?.lcd_type ?? null,
  }
}

export default function AdminTablesPage() {
  const { accessToken } = useAuth()
  const [tables, setTables] = React.useState<AdminTableRecord[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [floor, setFloor] = React.useState<(typeof floors)[number]>(1)
  /** JSON snapshot of last persisted state (localStorage now; replace with API success later). */
  const [savedRevision, setSavedRevision] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [weightSensors, setWeightSensors] = React.useState<AdminWeightSensor[]>(
    []
  )
  const [lcdDisplays, setLcdDisplays] = React.useState<AdminLCDDisplay[]>([])
  const deletedIdsRef = React.useRef<number[]>([])

  const historyRef = React.useRef<{
    past: AdminTableRecord[][]
    future: AdminTableRecord[][]
    lastJson: string
    suppressNext: boolean
  }>({ past: [], future: [], lastJson: "", suppressNext: false })

  const visibleTables = React.useMemo(
    () => tables.filter((t) => t.libraryFloor === floor),
    [tables, floor]
  )

  const sensorLinkStats = React.useMemo(() => {
    let linked = 0
    for (const t of visibleTables) {
      if (t.weightSensorId != null) linked += 1
    }
    return { linked, total: visibleTables.length }
  }, [visibleTables])

  const lcdLinkStats = React.useMemo(() => {
    let linked = 0
    for (const t of visibleTables) {
      if (t.lcdDisplayId != null) linked += 1
    }
    return { linked, total: visibleTables.length }
  }, [visibleTables])

  const selected = React.useMemo(
    () => tables.find((t) => t.id === selectedId) ?? null,
    [tables, selectedId]
  )

  const weightSensorsForSelect = React.useMemo(() => {
    if (!selected) return weightSensors
    const usedElsewhere = new Set(
      tables
        .filter((t) => t.id !== selected.id && t.weightSensorId != null)
        .map((t) => t.weightSensorId as number)
    )
    return weightSensors.filter(
      (s) => !usedElsewhere.has(s.id) || s.id === selected.weightSensorId
    )
  }, [weightSensors, tables, selected])

  const lcdDisplaysForSelect = React.useMemo(() => {
    if (!selected) return lcdDisplays
    const selNumeric = isNumericId(selected.id) ? Number(selected.id) : null
    return lcdDisplays.filter(
      (d) =>
        d.table_id == null ||
        (selNumeric != null && d.table_id === selNumeric)
    )
  }, [lcdDisplays, selected])

  const isDirty = React.useMemo(() => {
    if (tables.length === 0 && savedRevision === "") return false
    return JSON.stringify(tables) !== savedRevision
  }, [tables, savedRevision])

  const isFloorDirty = React.useMemo(() => {
    if (!savedRevision) return false
    try {
      const saved = JSON.parse(savedRevision) as AdminTableRecord[]
      if (!Array.isArray(saved)) return false
      const sortKey = (t: AdminTableRecord) => t.id
      const cur = tables
        .filter((t) => t.libraryFloor === floor)
        .slice()
        .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
      const sav = saved
        .filter((t) => t.libraryFloor === floor)
        .slice()
        .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
      return JSON.stringify(cur) !== JSON.stringify(sav)
    } catch {
      return false
    }
  }, [tables, savedRevision, floor])

  React.useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError("")
      try {
        if (!accessToken) {
          const loaded = loadTables()
          if (cancelled) return
          setTables(loaded)
          const json = JSON.stringify(loaded)
          historyRef.current.lastJson = json
          setSavedRevision(json)
          return
        }

        const apiTables = await apiAdminListTables(accessToken)
        if (cancelled) return

        const mapped: AdminTableRecord[] = apiTables.map(mapAdminApiTableToRecord)
        setTables(mapped)
        const json = JSON.stringify(mapped)
        historyRef.current.lastJson = json
        setSavedRevision(json)
      } catch (e) {
        const loaded = loadTables()
        if (cancelled) return
        setTables(loaded)
        const json = JSON.stringify(loaded)
        historyRef.current.lastJson = json
        setSavedRevision(json)
        setError(e instanceof Error ? e.message : "Failed to load tables")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [accessToken])

  React.useEffect(() => {
    if (!accessToken) {
      setWeightSensors([])
      setLcdDisplays([])
      return
    }
    let cancelled = false
    void apiAdminListWeightSensors(accessToken)
      .then((rows) => {
        if (!cancelled) setWeightSensors(rows)
      })
      .catch(() => {
        if (!cancelled) setWeightSensors([])
      })
    void apiAdminListLCDDisplays(accessToken)
      .then((rows) => {
        if (!cancelled) setLcdDisplays(rows)
      })
      .catch(() => {
        if (!cancelled) setLcdDisplays([])
      })
    return () => {
      cancelled = true
    }
  }, [accessToken])

  React.useEffect(() => {
    if (tables.length === 0) return
    const initialFloor = tables.some((t) => t.libraryFloor === 2) ? 1 : 1
    setFloor(initialFloor)
    const firstVisible = tables.find((t) => t.libraryFloor === initialFloor)
    setSelectedId((prev) => prev ?? firstVisible?.id ?? tables[0]?.id ?? null)
  }, [tables])

  React.useEffect(() => {
    if (tables.length === 0) return
    const json = JSON.stringify(tables)
    if (historyRef.current.suppressNext) {
      historyRef.current.suppressNext = false
      historyRef.current.lastJson = json
      return
    }
    if (json !== historyRef.current.lastJson) {
      historyRef.current.past.push(
        JSON.parse(historyRef.current.lastJson) as AdminTableRecord[]
      )
      historyRef.current.future = []
      historyRef.current.lastJson = json
    }
  }, [tables])

  React.useEffect(() => {
    if (!selectedId) return
    const sel = tables.find((t) => t.id === selectedId)
    if (sel && sel.libraryFloor === floor) return
    const first = tables.find((t) => t.libraryFloor === floor)
    setSelectedId(first?.id ?? null)
  }, [floor, selectedId, tables])

  const updateSelected = React.useCallback(
    (patch: Partial<AdminTableRecord>) => {
      if (!selectedId) return
      setTables((prev) =>
        prev.map((t) => (t.id === selectedId ? { ...t, ...patch } : t))
      )
    },
    [selectedId]
  )

  const onAdd = React.useCallback(() => {
    setTables((prev) => {
      const next = [...prev, createTable(prev, floor)]
      setSelectedId(next[next.length - 1]?.id ?? null)
      return next
    })
  }, [floor])

  const onRemove = React.useCallback(() => {
    if (!selectedId) return
    setTables((prev) => {
      const idx = prev.findIndex((t) => t.id === selectedId)
      if (idx >= 0) {
        const maybeNumeric = prev[idx]?.id
        if (maybeNumeric && isNumericId(maybeNumeric)) {
          deletedIdsRef.current.push(Number(maybeNumeric))
        }
      }
      const next = prev.filter((t) => t.id !== selectedId)
      const nextSelected =
        next[Math.min(idx, next.length - 1)]?.id ?? next[0]?.id ?? null
      setSelectedId(nextSelected)
      return next
    })
  }, [selectedId])

  const onReset = React.useCallback(() => {
    if (!savedRevision) return
    let saved: AdminTableRecord[]
    try {
      saved = JSON.parse(savedRevision) as AdminTableRecord[]
      if (!Array.isArray(saved)) return
    } catch {
      return
    }
    const restored = saved.filter((t) => t.libraryFloor === floor)
    const restoredBackendIds = new Set(
      restored.map((t) => t.id).filter(isNumericId).map((id) => Number(id))
    )
    deletedIdsRef.current = deletedIdsRef.current.filter(
      (id) => !restoredBackendIds.has(id)
    )
    historyRef.current.suppressNext = true
    setTables((prev) => {
      const keep = prev.filter((t) => t.libraryFloor !== floor)
      const next = [...keep, ...restored]
      setSelectedId(
        restored[0]?.id ??
          next.find((t) => t.libraryFloor === floor)?.id ??
          null
      )
      return next
    })
  }, [floor, savedRevision])

  const onSave = React.useCallback(async () => {
    setError("")
    if (!accessToken) {
      saveTables(tables)
      const json = JSON.stringify(tables)
      setSavedRevision(json)
      historyRef.current.lastJson = json
      window.dispatchEvent(new Event(LIBRARY_MAP_UPDATE_EVENT))
      return
    }

    try {
      // Apply deletes first (for records that existed on the backend).
      const toDelete = Array.from(new Set(deletedIdsRef.current))
      deletedIdsRef.current = []
      for (const id of toDelete) {
        // eslint-disable-next-line no-await-in-loop
        await apiAdminDeleteTable(accessToken, id)
      }

      const prevSelectedRow =
        selectedId != null ? tables.find((r) => r.id === selectedId) : null

      for (const t of tables) {
        const body = {
          table_number: t.tableNumber,
          table_type: t.tableType,
          library_floor: t.libraryFloor,
          position_x: t.positionX,
          position_y: t.positionY,
          is_reservable: t.isReservable,
          is_available: t.isAvailable,
          weight_sensor_id: t.weightSensorId ?? null,
          lcd_display_id: t.lcdDisplayId ?? null,
        }

        if (isNumericId(t.id)) {
          // eslint-disable-next-line no-await-in-loop
          await apiAdminUpdateTable(accessToken, Number(t.id), body)
        } else {
          // eslint-disable-next-line no-await-in-loop
          await apiAdminCreateTable(accessToken, body)
        }
      }

      const [refreshed, lcdRows] = await Promise.all([
        apiAdminListTables(accessToken),
        apiAdminListLCDDisplays(accessToken),
      ])
      setLcdDisplays(lcdRows)
      const mappedRefresh = refreshed.map(mapAdminApiTableToRecord)
      setTables(mappedRefresh)
      setSelectedId(
        prevSelectedRow
          ? mappedRefresh.find(
              (r) =>
                r.tableNumber === prevSelectedRow.tableNumber &&
                r.libraryFloor === prevSelectedRow.libraryFloor
            )?.id ?? mappedRefresh[0]?.id ?? null
          : mappedRefresh[0]?.id ?? null
      )
      const json = JSON.stringify(mappedRefresh)
      setSavedRevision(json)
      historyRef.current.lastJson = json
      window.dispatchEvent(new Event(LIBRARY_MAP_UPDATE_EVENT))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    }
  }, [accessToken, tables, selectedId])

  const canUndo = historyRef.current.past.length > 0
  const canRedo = historyRef.current.future.length > 0

  const onUndo = React.useCallback(() => {
    const h = historyRef.current
    const prev = h.past.pop()
    if (!prev) return
    h.future.unshift(tables)
    h.suppressNext = true
    setTables(prev)
  }, [tables])

  const onRedo = React.useCallback(() => {
    const h = historyRef.current
    const next = h.future.shift()
    if (!next) return
    h.past.push(tables)
    h.suppressNext = true
    setTables(next)
  }, [tables])

  const mapViewportRef = React.useRef<LibraryMapViewportHandle | null>(null)

  const dragState = React.useRef<{
    id: string
    startWorld: { x: number; y: number }
    baseX: number
    baseY: number
  } | null>(null)

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent, t: AdminTableRecord) => {
      const el = e.currentTarget as HTMLElement
      el.setPointerCapture(e.pointerId)
      setSelectedId(t.id)
      const w =
        mapViewportRef.current?.clientToWorld(e.clientX, e.clientY) ?? {
          x: 0,
          y: 0,
        }
      dragState.current = {
        id: t.id,
        startWorld: w,
        baseX: t.positionX,
        baseY: t.positionY,
      }
    },
    []
  )

  const handlePointerMove = React.useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return
    const s = dragState.current
    const api = mapViewportRef.current
    if (!api) return
    const w = api.worldPointWithDragAutoscroll(e.clientX, e.clientY)
    const dx = w.x - s.startWorld.x
    const dy = w.y - s.startWorld.y
    const x = snapPosition(s.baseX + dx, 0, mapSize.w - tileSize.w)
    const y = snapPosition(s.baseY + dy, 0, mapSize.h - tileSize.h)
    setTables((prev) => {
      const moving = prev.find((t) => t.id === s.id)
      if (!moving) return prev
      const blocked = isOverlapping(prev, {
        id: moving.id,
        floor: moving.libraryFloor,
        x,
        y,
      })
      if (blocked) return prev
      return prev.map((t) => (t.id === s.id ? { ...t, positionX: x, positionY: y } : t))
    })
  }, [])

  const handlePointerUp = React.useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return
    const el = e.currentTarget as HTMLElement
    try {
      el.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    dragState.current = null
  }, [])

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tables</h1>
          <p className="text-muted-foreground">
            Demo minimap editor. Drag to reposition, select to edit, add/remove
            tables. Click <span className="font-medium text-foreground">Save</span>{" "}
            to persist (browser storage for now; wire to your API later).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {isDirty ? "Unsaved changes" : "All changes saved"}
            </span>
            <Separator orientation="vertical" className="h-6" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Undo"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Redo"
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo2 className="size-4" />
            </Button>
          </div>
          <Button
            type="button"
            onClick={onSave}
              disabled={!isDirty || loading}
          >
            <Save />
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={!isFloorDirty || loading}
            aria-label="Reset unsaved changes on this floor"
          >
            Reset
          </Button>
          <Button type="button" onClick={onAdd}>
            <Plus />
            Add table
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_16rem] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch lg:gap-5 lg:overflow-hidden">
        <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:min-h-0 lg:h-full">
          <CardHeader className="shrink-0">
            <CardTitle>Library top view</CardTitle>
            <CardDescription>
              Drag tiles to reposition. Solid tiles are reservable online; dashed
              tiles are not. A scale icon appears when a weight sensor is linked; a
              monitor icon appears when an LCD display is linked. When the map is wider
              than the frame, drag empty space to pan or Shift+scroll. Editing floor{" "}
              {floor}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
            <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center rounded-lg border bg-background p-1 shadow-sm">
                {floors.map((f) => {
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
                  Editing <span className="font-medium text-foreground">Floor {floor}</span>
                </span>
              </div>
              <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <Scale className="size-3.5 shrink-0 text-primary" aria-hidden />
                  <span>
                    {sensorLinkStats.linked}/{sensorLinkStats.total} sensor
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Monitor className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
                  <span>
                    {lcdLinkStats.linked}/{lcdLinkStats.total} LCD
                  </span>
                </span>
                <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
                <span>
                  {visibleTables.length} table{visibleTables.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <div
              className={cn(
                "flex min-h-0 w-full min-w-0 flex-1 flex-col",
                LIBRARY_MAP_ADMIN_TABLES_VIEWPORT_WRAP_CLASSNAME
              )}
            >
            <LibraryMapPannableViewport
              ref={mapViewportRef}
              aria-label={`Admin library map, floor ${floor}. Drag tiles to move, or drag empty area to pan.`}
              overflowHintPlacement="below"
              overflowHintText="Drag empty space · Shift+scroll sideways · drag table near edge to pan"
            >
              {visibleTables.map((t) => {
                const active = t.id === selectedId
                const TypeIcon = tableTypeIcon(t.tableType)
                const hasSensor = t.weightSensorId != null
                const hasLcd = t.lcdDisplayId != null
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Table ${t.tableNumber}${
                      t.isReservable ? "" : ", not reservable online"
                    }${hasSensor ? ", weight sensor linked" : ""}${
                      hasLcd ? ", LCD display linked" : ""
                    }`}
                    onPointerDown={(e) => handlePointerDown(e, t)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className={cn(
                      "absolute select-none rounded-lg border px-1.5 py-1 shadow-sm outline-none",
                      "cursor-grab active:cursor-grabbing",
                      "focus-visible:ring-1 focus-visible:ring-ring",
                      active
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : t.isReservable
                          ? "border-border bg-background hover:bg-muted/40"
                          : "border-dashed border-muted-foreground/45 bg-muted/45 text-muted-foreground hover:bg-muted/60",
                      t.isAvailable ? "" : "opacity-75"
                    )}
                    style={{
                      left: t.positionX,
                      top: t.positionY,
                      width: tileSize.w,
                      height: tileSize.h,
                      touchAction: "none",
                    }}
                  >
                    <div className="flex items-center justify-between gap-0.5">
                      <span className="flex min-w-0 items-center gap-0.5 font-mono text-[11px] leading-none text-muted-foreground">
                        #{t.tableNumber}
                        {!t.isReservable ? (
                          <Lock
                            className="size-3 shrink-0 opacity-70"
                            aria-hidden
                          />
                        ) : null}
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5">
                        {hasSensor ? (
                          <span
                            className="inline-flex"
                            title="Weight sensor linked"
                          >
                            <Scale
                              className="size-3 shrink-0 text-primary"
                              aria-hidden
                            />
                          </span>
                        ) : null}
                        {hasLcd ? (
                          <span
                            className="inline-flex"
                            title={
                              t.lcdDisplayType
                                ? `LCD: ${t.lcdDisplayType}`
                                : "LCD display linked"
                            }
                          >
                            <Monitor
                              className="size-3 shrink-0 text-sky-600 dark:text-sky-400"
                              aria-hidden
                            />
                          </span>
                        ) : null}
                        <TypeIcon
                          className="size-3.5 shrink-0 text-muted-foreground/80"
                          aria-hidden
                        />
                      </span>
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
            </LibraryMapPannableViewport>
            </div>
          </CardContent>
        </Card>

        <Card className="flex w-full min-w-0 max-w-full flex-col overflow-hidden lg:w-[16rem] lg:shadow-sm">
          <CardHeader className="shrink-0 space-y-1 px-4 py-3 pb-2">
            <CardTitle className="text-base">Details</CardTitle>
            <CardDescription className="text-xs leading-snug">
              {selected ? (
                <>
                  Table <span className="font-mono">#{selected.tableNumber}</span>
                </>
              ) : (
                "Tap a seat on the map."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 space-y-3 overflow-y-auto px-4 pb-4 pt-0">
            {error ? (
              <div
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-xs text-destructive"
              >
                {error}
              </div>
            ) : null}
            {!selected || selected.libraryFloor !== floor ? null : (
              <>
                <div className="grid gap-2">
                  <label className="grid gap-1 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Number
                    </span>
                    <input
                      className="h-8 w-full rounded-md border bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      type="number"
                      min={1}
                      value={selected.tableNumber}
                      onChange={(e) =>
                        updateSelected({ tableNumber: Number(e.target.value) })
                      }
                    />
                  </label>

                  <label className="grid gap-1 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Type
                    </span>
                    <select
                      className="h-8 w-full rounded-md border bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={selected.tableType}
                      onChange={(e) => updateSelected({ tableType: e.target.value })}
                    >
                      {tableTypes.map((t) => (
                        <option key={t} value={t}>
                          {tableTypeLabel(t)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Floor
                    </span>
                    <input
                      className="h-8 w-full rounded-md border bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      type="number"
                      min={1}
                      value={selected.libraryFloor}
                      onChange={(e) =>
                        updateSelected({ libraryFloor: Number(e.target.value) })
                      }
                    />
                  </label>

                  <label className="grid gap-1 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Reservable
                    </span>
                    <span className="flex h-8 w-full items-center justify-start">
                      <Switch
                        className="scale-90"
                        checked={selected.isReservable}
                        onCheckedChange={(v) =>
                          updateSelected({ isReservable: v })
                        }
                      />
                    </span>
                  </label>

                  <label className="grid gap-1 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Available
                    </span>
                    <span className="flex h-8 w-full items-center justify-start">
                      <Switch
                        className="scale-90"
                        checked={selected.isAvailable}
                        onCheckedChange={(v) => updateSelected({ isAvailable: v })}
                      />
                    </span>
                  </label>

                  <div className="grid gap-1 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Weight sensor
                    </span>
                    <select
                      className="h-8 w-full max-w-full rounded-md border bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={
                        selected.weightSensorId != null
                          ? String(selected.weightSensorId)
                          : ""
                      }
                      onChange={(e) => {
                        const v = e.target.value
                        updateSelected({
                          weightSensorId: v === "" ? null : Number(v),
                        })
                      }}
                      disabled={!accessToken}
                    >
                      <option value="">None</option>
                      {weightSensorsForSelect.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.name} (#{s.id})
                        </option>
                      ))}
                    </select>
                    {!accessToken ? (
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        Sign in to load sensors from the API. Offline layout is
                        still saved in the browser.
                      </p>
                    ) : weightSensors.length === 0 ? (
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        No sensors yet.{" "}
                        <Link
                          href="/admin/weight-sensors"
                          className="font-medium text-primary underline-offset-2 hover:underline"
                        >
                          Add weight sensors
                        </Link>
                        .
                      </p>
                    ) : (
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        Sensors already linked to another table are hidden here.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-1 text-xs">
                    <span className="font-medium text-muted-foreground">
                      LCD display
                    </span>
                    <select
                      className="h-8 w-full max-w-full rounded-md border bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={
                        selected.lcdDisplayId != null
                          ? String(selected.lcdDisplayId)
                          : ""
                      }
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === "") {
                          updateSelected({
                            lcdDisplayId: null,
                            lcdDisplayType: null,
                          })
                          return
                        }
                        const id = Number(v)
                        const lcd = lcdDisplays.find((d) => d.id === id)
                        updateSelected({
                          lcdDisplayId: id,
                          lcdDisplayType: lcd?.lcd_type ?? null,
                        })
                      }}
                      disabled={!accessToken}
                    >
                      <option value="">None</option>
                      {lcdDisplaysForSelect.map((d) => (
                        <option key={d.id} value={String(d.id)}>
                          {d.lcd_type} (#{d.id})
                        </option>
                      ))}
                    </select>
                    {!accessToken ? (
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        Sign in to assign LCD rows from the API.
                      </p>
                    ) : lcdDisplays.length === 0 ? (
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        No LCD rows yet.{" "}
                        <Link
                          href="/admin/lcd-displays"
                          className="font-medium text-primary underline-offset-2 hover:underline"
                        >
                          Add LCD displays
                        </Link>
                        .
                      </p>
                    ) : (
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        Displays already linked to another table are hidden here.
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 w-full text-xs"
                  onClick={onRemove}
                  disabled={!selectedId}
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

