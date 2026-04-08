"use client"

import * as React from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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

const dt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export default function AdminLCDDisplaysPage() {
  const { accessToken } = useAuth()
  const [rows, setRows] = React.useState<AdminLCDDisplay[]>([])
  const [tables, setTables] = React.useState<AdminTable[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [lcdType, setLcdType] = React.useState("")
  const [tableId, setTableId] = React.useState<number | null>(null)
  const [isAvailable, setIsAvailable] = React.useState(true)
  const [editingId, setEditingId] = React.useState<number | null>(null)

  const tableLabel = React.useMemo(() => {
    const m = new Map<number, number>()
    for (const t of tables) m.set(t.id, t.table_number)
    return m
  }, [tables])

  const load = React.useCallback(async () => {
    if (!accessToken) return
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
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  React.useEffect(() => {
    void load()
  }, [load])

  const startEdit = (r: AdminLCDDisplay) => {
    setEditingId(r.id)
    setLcdType(r.lcd_type)
    setTableId(r.table_id)
    setIsAvailable(r.is_available)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setLcdType("")
    setTableId(null)
    setIsAvailable(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken || !lcdType.trim()) return
    setError("")
    try {
      const body = {
        lcd_type: lcdType.trim(),
        table_id: tableId,
        is_available: isAvailable,
      }
      if (editingId != null) {
        await apiAdminUpdateLCDDisplay(accessToken, editingId, body)
      } else {
        await apiAdminCreateLCDDisplay(accessToken, body)
      }
      cancelEdit()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    }
  }

  const onDelete = async (id: number) => {
    if (!accessToken) return
    if (!window.confirm("Delete this LCD display?")) return
    setError("")
    try {
      await apiAdminDeleteLCDDisplay(accessToken, id)
      if (editingId === id) cancelEdit()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed")
    }
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">LCD displays</h1>
        <p className="text-muted-foreground">
          Register displays and optionally assign one table per device (one-to-one).
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="w-full min-w-0 space-y-4 rounded-xl border bg-card p-4 shadow-sm"
      >
        <h2 className="text-sm font-semibold">
          {editingId != null ? `Edit display #${editingId}` : "Add display"}
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="grid min-w-[160px] flex-1 gap-2">
            <Label htmlFor="lcd-type">Type</Label>
            <Input
              id="lcd-type"
              value={lcdType}
              onChange={(e) => setLcdType(e.target.value)}
              placeholder="e.g. status_board"
              required
            />
          </div>
          <div className="grid min-w-[160px] flex-1 gap-2">
            <Label htmlFor="lcd-table">Table</Label>
            <select
              id="lcd-table"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={tableId === null ? "" : String(tableId)}
              onChange={(e) =>
                setTableId(e.target.value === "" ? null : Number(e.target.value))
              }
            >
              <option value="">Unassigned</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table #{t.table_number}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            <Label className="text-sm font-normal">Available</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!accessToken}>
              {editingId != null ? (
                <>
                  <Pencil className="size-4" />
                  Update
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Add
                </>
              )}
            </Button>
            {editingId != null ? (
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </form>

      <div className="w-full min-w-0 rounded-xl border bg-card shadow-sm">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No LCD displays yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Recorded</TableHead>
                <TableHead>Available</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {r.id}
                  </TableCell>
                  <TableCell className="font-medium">{r.lcd_type}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.table_id == null
                      ? "—"
                      : `#${tableLabel.get(r.table_id) ?? r.table_id}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.recorded_at
                      ? dt.format(new Date(r.recorded_at))
                      : "—"}
                  </TableCell>
                  <TableCell>{r.is_available ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        aria-label={`Edit LCD ${r.id}`}
                        onClick={() => startEdit(r)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        aria-label={`Delete LCD ${r.id}`}
                        onClick={() => void onDelete(r.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
