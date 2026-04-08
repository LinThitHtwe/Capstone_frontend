"use client"

import * as React from "react"

import {
  Circle,
  Plus,
  Redo2,
  Save,
  Square,
  Trash2,
  Undo2,
  Users,
} from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { LibraryMapPannableViewport } from "@/components/library/library-map-pannable-viewport"
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
  apiAdminListTables,
  apiAdminUpdateTable,
} from "@/lib/api"
import {
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
    return parsed
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
  }
}

function isNumericId(id: string): boolean {
  return /^\d+$/.test(id)
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

  const selected = React.useMemo(
    () => tables.find((t) => t.id === selectedId) ?? null,
    [tables, selectedId]
  )

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

        const mapped: AdminTableRecord[] = apiTables.map((t) => ({
          id: String(t.id),
          tableNumber: t.table_number,
          tableType: t.table_type,
          libraryFloor: t.library_floor,
          positionX: t.position_x,
          positionY: t.position_y,
          isReservable: t.is_reservable,
          isAvailable: t.is_available,
        }))
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

      // Upsert all current tables.
      const idRemap = new Map<string, string>()
      for (const t of tables) {
        const body = {
          table_number: t.tableNumber,
          table_type: t.tableType,
          library_floor: t.libraryFloor,
          position_x: t.positionX,
          position_y: t.positionY,
          is_reservable: t.isReservable,
          is_available: t.isAvailable,
          weight_sensor_id: null,
        }

        if (isNumericId(t.id)) {
          // eslint-disable-next-line no-await-in-loop
          await apiAdminUpdateTable(accessToken, Number(t.id), body)
        } else {
          // eslint-disable-next-line no-await-in-loop
          const created = await apiAdminCreateTable(accessToken, body)
          idRemap.set(t.id, String(created.id))
        }
      }

      if (idRemap.size) {
        setTables((prev) =>
          prev.map((t) => {
            const nextId = idRemap.get(t.id)
            return nextId ? { ...t, id: nextId } : t
          })
        )
      }

      const json = JSON.stringify(
        tables.map((t) => ({ ...t, id: idRemap.get(t.id) ?? t.id }))
      )
      setSavedRevision(json)
      historyRef.current.lastJson = json
      window.dispatchEvent(new Event(LIBRARY_MAP_UPDATE_EVENT))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    }
  }, [accessToken, tables])

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

  const dragState = React.useRef<{
    id: string
    startX: number
    startY: number
    baseX: number
    baseY: number
  } | null>(null)

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent, t: AdminTableRecord) => {
      const el = e.currentTarget as HTMLElement
      el.setPointerCapture(e.pointerId)
      setSelectedId(t.id)
      dragState.current = {
        id: t.id,
        startX: e.clientX,
        startY: e.clientY,
        baseX: t.positionX,
        baseY: t.positionY,
      }
    },
    []
  )

  const handlePointerMove = React.useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return
    const s = dragState.current
    const dx = e.clientX - s.startX
    const dy = e.clientY - s.startY
    const x = snap(clamp(s.baseX + dx, 0, mapSize.w - tileSize.w))
    const y = snap(clamp(s.baseY + dy, 0, mapSize.h - tileSize.h))
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
    <div className="flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 overflow-hidden">
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

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto lg:grid-cols-[1fr_13.5rem] lg:grid-rows-[minmax(0,1fr)] lg:items-start lg:gap-5 lg:overflow-hidden">
        <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:min-h-0 lg:h-full lg:self-stretch">
          <CardHeader className="shrink-0">
            <CardTitle>Library top view</CardTitle>
            <CardDescription>
              Drag tiles to reposition. When the map is larger than the frame,
              scroll or drag empty space to pan. Editing floor {floor}.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
              <div className="text-sm text-muted-foreground">
                {visibleTables.length} table{visibleTables.length === 1 ? "" : "s"}
              </div>
            </div>
            <LibraryMapPannableViewport
              aria-label={`Admin library map, floor ${floor}. Drag tiles to move, or drag empty area to pan.`}
              overflowHintText="Scroll or drag sideways · drag tiles to move"
              onScrollAreaPointerMove={handlePointerMove}
              onScrollAreaPointerUp={handlePointerUp}
              onScrollAreaPointerCancel={handlePointerUp}
            >
              {visibleTables.map((t) => {
                const active = t.id === selectedId
                const TypeIcon = tableTypeIcon(t.tableType)
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Table ${t.tableNumber}`}
                    onPointerDown={(e) => handlePointerDown(e, t)}
                    className={cn(
                      "absolute select-none rounded-lg border px-1.5 py-1 shadow-sm outline-none",
                      "cursor-grab active:cursor-grabbing",
                      "focus-visible:ring-1 focus-visible:ring-ring",
                      active
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "bg-background hover:bg-muted/40",
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
            </LibraryMapPannableViewport>
          </CardContent>
        </Card>

        <Card className="flex w-full min-w-0 max-w-full flex-col overflow-hidden lg:w-[13.5rem] lg:self-start lg:shadow-sm">
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

