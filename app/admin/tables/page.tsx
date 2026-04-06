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

export default function AdminTablesPage() {
  const [tables, setTables] = React.useState<AdminTableRecord[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [floor, setFloor] = React.useState<(typeof floors)[number]>(1)
  /** JSON snapshot of last persisted state (localStorage now; replace with API success later). */
  const [savedRevision, setSavedRevision] = React.useState("")

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

  React.useEffect(() => {
    const loaded = loadTables()
    setTables(loaded)
    const initialFloor = loaded.some((t) => t.libraryFloor === 2) ? 1 : 1
    setFloor(initialFloor)
    const firstVisible = loaded.find((t) => t.libraryFloor === initialFloor)
    setSelectedId((prev) => prev ?? firstVisible?.id ?? loaded[0]?.id ?? null)
    const json = JSON.stringify(loaded)
    historyRef.current.lastJson = json
    setSavedRevision(json)
  }, [])

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
      const next = prev.filter((t) => t.id !== selectedId)
      const nextSelected =
        next[Math.min(idx, next.length - 1)]?.id ?? next[0]?.id ?? null
      setSelectedId(nextSelected)
      return next
    })
  }, [selectedId])

  const onReset = React.useCallback(() => {
    setTables(defaultAdminTables)
    setSelectedId(defaultAdminTables[0]?.id ?? null)
  }, [])

  const onSave = React.useCallback(() => {
    saveTables(tables)
    const json = JSON.stringify(tables)
    setSavedRevision(json)
    historyRef.current.lastJson = json
    window.dispatchEvent(new Event(LIBRARY_MAP_UPDATE_EVENT))
    // Later: await fetch('/api/admin/tables', { method: 'PUT', body: json })
  }, [tables])

  const onResetFloor = React.useCallback(() => {
    setTables((prev) => {
      const keepOtherFloors = prev.filter((t) => t.libraryFloor !== floor)
      const resetThisFloor = defaultAdminTables.filter((t) => t.libraryFloor === floor)
      const next = [...keepOtherFloors, ...resetThisFloor]
      setSelectedId(resetThisFloor[0]?.id ?? next.find((t) => t.libraryFloor === floor)?.id ?? null)
      return next
    })
  }, [floor])

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
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
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
            disabled={!isDirty}
          >
            <Save />
            Save
          </Button>
          <Button type="button" variant="outline" onClick={onResetFloor}>
            Reset floor
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
            Reset all
          </Button>
          <Button type="button" onClick={onAdd}>
            <Plus />
            Add table
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <Card>
          <CardHeader>
            <CardTitle>Library top view</CardTitle>
            <CardDescription>
              Drag tiles to reposition. Editing floor {floor}.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
            <div
              className="relative overflow-hidden rounded-xl border bg-muted/20"
              style={{
                width: "100%",
                maxWidth: mapSize.w,
                height: mapSize.h,
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>
              {selected ? (
                <>
                  Editing table <span className="font-mono">#{selected.tableNumber}</span>
                </>
              ) : (
                "Select a table on the map."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!selected || selected.libraryFloor !== floor ? null : (
              <>
                <div className="grid gap-3">
                  <label className="grid gap-1.5 text-sm">
                    <span className="text-xs font-medium text-muted-foreground">
                      Table number
                    </span>
                    <input
                      className="h-9 rounded-md border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      type="number"
                      min={1}
                      value={selected.tableNumber}
                      onChange={(e) =>
                        updateSelected({ tableNumber: Number(e.target.value) })
                      }
                    />
                  </label>

                  <label className="grid gap-1.5 text-sm">
                    <span className="text-xs font-medium text-muted-foreground">
                      Table type
                    </span>
                    <select
                      className="h-9 rounded-md border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid min-w-0 gap-1.5 text-sm">
                      <span className="text-xs font-medium text-muted-foreground">
                        Floor
                      </span>
                      <input
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        type="number"
                        min={1}
                        value={selected.libraryFloor}
                        onChange={(e) =>
                          updateSelected({ libraryFloor: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label className="grid min-w-0 gap-1.5 text-sm">
                      <span className="text-xs font-medium text-muted-foreground">
                        Reservable
                      </span>
                      <span className="flex h-9 w-full min-w-0 items-center justify-between gap-3 rounded-md border bg-background px-3 text-sm shadow-sm">
                        <span className="min-w-0 truncate text-muted-foreground">
                          {selected.isReservable ? "Yes" : "No"}
                        </span>
                        <Switch
                          checked={selected.isReservable}
                          onCheckedChange={(v) =>
                            updateSelected({ isReservable: v })
                          }
                        />
                      </span>
                    </label>
                  </div>

                  <label className="grid gap-1.5 text-sm">
                    <span className="text-xs font-medium text-muted-foreground">
                      Available
                    </span>
                    <span className="flex h-9 items-center justify-between gap-3 rounded-md border bg-background px-3 text-sm shadow-sm">
                      <span className="text-muted-foreground">
                        {selected.isAvailable ? "Yes" : "No"}
                      </span>
                      <Switch
                        checked={selected.isAvailable}
                        onCheckedChange={(v) => updateSelected({ isAvailable: v })}
                      />
                    </span>
                  </label>

                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onRemove}
                    disabled={!selectedId}
                  >
                    <Trash2 />
                    Remove
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

