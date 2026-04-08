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
  apiAdminCreateWeightSensor,
  apiAdminDeleteWeightSensor,
  apiAdminListWeightSensors,
  apiAdminUpdateWeightSensor,
  type AdminWeightSensor,
} from "@/lib/api"

const dt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export default function AdminWeightSensorsPage() {
  const { accessToken } = useAuth()
  const [rows, setRows] = React.useState<AdminWeightSensor[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [isAvailable, setIsAvailable] = React.useState(true)
  const [editingId, setEditingId] = React.useState<number | null>(null)

  const load = React.useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError("")
    try {
      const data = await apiAdminListWeightSensors(accessToken)
      setRows(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  React.useEffect(() => {
    void load()
  }, [load])

  const startEdit = (r: AdminWeightSensor) => {
    setEditingId(r.id)
    setLocation(r.location)
    setIsAvailable(r.is_available)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setLocation("")
    setIsAvailable(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken || !location.trim()) return
    setError("")
    try {
      if (editingId != null) {
        await apiAdminUpdateWeightSensor(accessToken, editingId, {
          location: location.trim(),
          is_available: isAvailable,
        })
      } else {
        await apiAdminCreateWeightSensor(accessToken, {
          location: location.trim(),
          is_available: isAvailable,
        })
      }
      cancelEdit()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    }
  }

  const onDelete = async (id: number) => {
    if (!accessToken) return
    if (!window.confirm("Delete this weight sensor?")) return
    setError("")
    try {
      await apiAdminDeleteWeightSensor(accessToken, id)
      if (editingId === id) cancelEdit()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed")
    }
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Weight sensors</h1>
        <p className="text-muted-foreground">
          Add sensors here, then attach them to tables from the tables map when you wire
          hardware.
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
          {editingId != null ? `Edit sensor #${editingId}` : "Add sensor"}
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="grid min-w-[200px] flex-1 gap-2">
            <Label htmlFor="ws-loc">Location</Label>
            <Input
              id="ws-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. North wing — table cluster"
              required
            />
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
          <p className="p-4 text-sm text-muted-foreground">No sensors yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last reading</TableHead>
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
                  <TableCell className="font-medium">{r.location}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.last_reading_at
                      ? dt.format(new Date(r.last_reading_at))
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
                        aria-label={`Edit sensor ${r.id}`}
                        onClick={() => startEdit(r)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        aria-label={`Delete sensor ${r.id}`}
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
