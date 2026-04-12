"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  apiAdminCreateLCDDisplay,
  apiAdminDeleteLCDDisplay,
  apiAdminListLCDDisplays,
  apiAdminListTables,
  apiAdminUpdateLCDDisplay,
  type AdminLCDDisplay,
  type AdminTable,
} from "@/lib/api"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 15

const dt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

type SortField =
  | "id"
  | "lcd_type"
  | "recorded_at"
  | "is_available"
  | "table_number"

function nextOrdering(current: string, field: SortField): string {
  if (current === field) return `-${field}`
  if (current === `-${field}`) return field
  if (field === "id" || field === "recorded_at" || field === "is_available") {
    return `-${field}`
  }
  return field
}

function SortIcon({
  field,
  ordering,
}: {
  field: SortField
  ordering: string
}) {
  if (ordering === field) {
    return <ArrowUp className="size-3.5 shrink-0 opacity-70" aria-hidden />
  }
  if (ordering === `-${field}`) {
    return <ArrowDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
  }
  return <ArrowUpDown className="size-3.5 shrink-0 opacity-35" aria-hidden />
}

function tableSortKey(r: AdminLCDDisplay, desc: boolean): number {
  const resolved = r.assigned_table?.table_number
  if (resolved == null) return desc ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY
  return resolved
}

function compareRows(a: AdminLCDDisplay, b: AdminLCDDisplay, ordering: string): number {
  const desc = ordering.startsWith("-")
  const field = (desc ? ordering.slice(1) : ordering) as SortField
  const mul = desc ? -1 : 1

  let va: string | number | boolean | null = null
  let vb: string | number | boolean | null = null

  switch (field) {
    case "id":
      va = a.id
      vb = b.id
      break
    case "lcd_type":
      va = a.lcd_type.toLowerCase()
      vb = b.lcd_type.toLowerCase()
      break
    case "recorded_at":
      va = a.recorded_at ? new Date(a.recorded_at).getTime() : 0
      vb = b.recorded_at ? new Date(b.recorded_at).getTime() : 0
      break
    case "is_available":
      va = a.is_available ? 1 : 0
      vb = b.is_available ? 1 : 0
      break
    case "table_number":
      va = tableSortKey(a, desc)
      vb = tableSortKey(b, desc)
      break
    default:
      return 0
  }

  if (va === vb) return 0
  if (
    typeof va === "number" &&
    typeof vb === "number" &&
    Number.isFinite(va) &&
    Number.isFinite(vb)
  ) {
    return va < vb ? -mul : mul
  }
  if (va == null || vb == null) return 0
  return va < vb ? -mul : mul
}

function tableSelectClassName() {
  return "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
}

export function AdminLCDDisplaysDataTable() {
  const { accessToken } = useAuth()
  const [rows, setRows] = React.useState<AdminLCDDisplay[]>([])
  const [tables, setTables] = React.useState<AdminTable[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [ordering, setOrdering] = React.useState("-id")
  const [page, setPage] = React.useState(1)

  const [addOpen, setAddOpen] = React.useState(false)
  const [addType, setAddType] = React.useState("")
  const [addTableId, setAddTableId] = React.useState<number | null>(null)
  const [addSaving, setAddSaving] = React.useState(false)

  const [editRow, setEditRow] = React.useState<AdminLCDDisplay | null>(null)
  const [editType, setEditType] = React.useState("")
  const [editTableId, setEditTableId] = React.useState<number | null>(null)
  const [editSaving, setEditSaving] = React.useState(false)

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(t)
  }, [search])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const load = React.useCallback(async () => {
    if (!accessToken) {
      setLoading(false)
      setRows([])
      setTables([])
      return
    }
    setLoading(true)
    setError("")
    try {
      const [lcds, tbls] = await Promise.all([
        apiAdminListLCDDisplays(accessToken),
        apiAdminListTables(accessToken),
      ])
      setRows(lcds)
      setTables(tbls)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load LCD displays")
      setRows([])
      setTables([])
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  React.useEffect(() => {
    void load()
  }, [load])

  const filtered = React.useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const tn = r.assigned_table?.table_number
      const parts = [
        String(r.id),
        r.lcd_type.toLowerCase(),
        tn != null ? String(tn) : "",
        r.assigned_table ? `floor ${r.assigned_table.library_floor}` : "",
      ]
      return parts.some((p) => p.includes(q))
    })
  }, [rows, debouncedSearch])

  const sorted = React.useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => compareRows(a, b, ordering))
    return copy
  }, [filtered, ordering])

  const count = sorted.length
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const from = count === 0 ? 0 : (pageClamped - 1) * PAGE_SIZE + 1
  const to = Math.min(pageClamped * PAGE_SIZE, count)
  const pageRows = sorted.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const onSort = (field: SortField) => {
    setOrdering((prev) => nextOrdering(prev, field))
    setPage(1)
  }

  const sortButton = (field: SortField, label: string) => (
    <Button
      type="button"
      variant="ghost"
      className="-ml-3 h-8 gap-1 px-3 font-medium text-muted-foreground hover:text-foreground"
      onClick={() => onSort(field)}
      aria-sort={
        ordering === field ? "ascending" : ordering === `-${field}` ? "descending" : "none"
      }
    >
      {label}
      <SortIcon field={field} ordering={ordering} />
    </Button>
  )

  const openAdd = () => {
    setAddType("")
    setAddTableId(null)
    setAddOpen(true)
  }

  const submitAdd = async () => {
    if (!accessToken || !addType.trim()) return
    setAddSaving(true)
    setError("")
    try {
      const body: Parameters<typeof apiAdminCreateLCDDisplay>[1] = { lcd_type: addType.trim() }
      if (addTableId != null) body.table_id = addTableId
      await apiAdminCreateLCDDisplay(accessToken, body)
      setAddOpen(false)
      setAddType("")
      setAddTableId(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add display")
    } finally {
      setAddSaving(false)
    }
  }

  const openEdit = (r: AdminLCDDisplay) => {
    setEditRow(r)
    setEditType(r.lcd_type)
    setEditTableId(r.table_id ?? r.assigned_table?.id ?? null)
  }

  const submitEdit = async () => {
    if (!accessToken || !editRow || !editType.trim()) return
    setEditSaving(true)
    setError("")
    try {
      await apiAdminUpdateLCDDisplay(accessToken, editRow.id, {
        lcd_type: editType.trim(),
        table_id: editTableId,
      })
      setEditRow(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update display")
    } finally {
      setEditSaving(false)
    }
  }

  const onDelete = async (r: AdminLCDDisplay) => {
    if (!accessToken) return
    if (
      !window.confirm(
        `Delete LCD display “${r.lcd_type}”? Tables linked to it should be updated first.`
      )
    ) {
      return
    }
    setError("")
    try {
      await apiAdminDeleteLCDDisplay(accessToken, r.id)
      if (editRow?.id === r.id) setEditRow(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed")
    }
  }

  const tableOptions = (
    <>
      <option value="">Unassigned</option>
      {tables.map((t) => (
        <option key={t.id} value={t.id}>
          Table #{t.table_number}
        </option>
      ))}
    </>
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Search by type, ID, or table number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
          aria-label="Search LCD displays"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
          <Button type="button" size="sm" onClick={openAdd} disabled={!accessToken}>
            <Plus className="size-4" />
            Add display
          </Button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="w-full min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[72px]">{sortButton("id", "ID")}</TableHead>
              <TableHead>{sortButton("lcd_type", "Type")}</TableHead>
              <TableHead>{sortButton("table_number", "Assigned table")}</TableHead>
              <TableHead>{sortButton("recorded_at", "Recorded")}</TableHead>
              <TableHead className="text-right">
                <div className="flex justify-end">{sortButton("is_available", "Available")}</div>
              </TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {debouncedSearch
                    ? "No displays match your search."
                    : "No LCD displays yet. Add one to attach it from the tables map."}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                  <TableCell className="max-w-[220px] truncate font-medium">{r.lcd_type}</TableCell>
                  <TableCell className="text-sm">
                    {r.assigned_table ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="tabular-nums">
                          Table <span className="font-medium">#{r.assigned_table.table_number}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            · Floor {r.assigned_table.library_floor}
                          </span>
                        </span>
                        <Link
                          href="/admin/tables"
                          className="w-fit text-xs font-medium text-primary underline-offset-2 hover:underline"
                        >
                          Map editor
                        </Link>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {r.recorded_at ? dt.format(new Date(r.recorded_at)) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                        r.is_available
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100"
                          : "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-950/50 dark:text-rose-100"
                      )}
                    >
                      {r.is_available ? "Yes" : "No"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        aria-label={`Edit ${r.lcd_type}`}
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        aria-label={`Delete ${r.lcd_type}`}
                        onClick={() => void onDelete(r)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div
          className={cn(
            "flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
            loading && "opacity-60"
          )}
        >
          <p className="text-sm text-muted-foreground">
            {count === 0
              ? "0 displays"
              : `Showing ${from}–${to} of ${count}${debouncedSearch ? " (filtered)" : ""}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageClamped <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="min-w-[5rem] text-center text-sm tabular-nums text-muted-foreground">
              Page {pageClamped} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pageClamped >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add LCD display</DialogTitle>
            <DialogDescription>
              Enter a type label (e.g. status_board). Optionally assign a table now, or link from the{" "}
              <Link href="/admin/tables" className="font-medium text-primary underline-offset-2 hover:underline">
                tables map
              </Link>
              . Availability is not editable here; it is driven by the device or system logic.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="lcd-add-type">Type</Label>
              <Input
                id="lcd-add-type"
                value={addType}
                onChange={(e) => setAddType(e.target.value)}
                placeholder="e.g. status_board"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lcd-add-table">Table (optional)</Label>
              <select
                id="lcd-add-table"
                className={tableSelectClassName()}
                value={addTableId === null ? "" : String(addTableId)}
                onChange={(e) =>
                  setAddTableId(e.target.value === "" ? null : Number(e.target.value))
                }
              >
                {tableOptions}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!addType.trim() || addSaving} onClick={() => void submitAdd()}>
              {addSaving ? "Adding…" : "Add display"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editRow != null} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit display #{editRow?.id}</DialogTitle>
            <DialogDescription>
              Update the type or table assignment. You can also relink from the{" "}
              <Link href="/admin/tables" className="font-medium text-primary underline-offset-2 hover:underline">
                tables map
              </Link>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="lcd-edit-type">Type</Label>
              <Input
                id="lcd-edit-type"
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                placeholder="Display type"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lcd-edit-table">Table</Label>
              <select
                id="lcd-edit-table"
                className={tableSelectClassName()}
                value={editTableId === null ? "" : String(editTableId)}
                onChange={(e) =>
                  setEditTableId(e.target.value === "" ? null : Number(e.target.value))
                }
              >
                {tableOptions}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={!editType.trim() || editSaving} onClick={() => void submitEdit()}>
              {editSaving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
