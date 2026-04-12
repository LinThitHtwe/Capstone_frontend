"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  apiAdminListReservations,
  type AdminReservation,
  type PaginatedResults,
} from "@/lib/api"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 15

type SortField =
  | "id"
  | "user_email"
  | "user_name"
  | "table_number"
  | "start_time"
  | "end_time"
  | "duration_minutes"
  | "created_at"
  | "is_available"

function nextOrdering(current: string, field: SortField): string {
  if (current === field) return `-${field}`
  if (current === `-${field}`) return field
  if (
    field === "start_time" ||
    field === "end_time" ||
    field === "created_at" ||
    field === "id" ||
    field === "is_available"
  ) {
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

const dt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export function AdminReservationsDataTable() {
  const { accessToken } = useAuth()
  const [rows, setRows] = React.useState<AdminReservation[]>([])
  const [count, setCount] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [ordering, setOrdering] = React.useState("-start_time")
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(t)
  }, [search])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const load = React.useCallback(async () => {
    if (!accessToken) {
      setLoading(false)
      setRows([])
      setCount(0)
      return
    }
    setLoading(true)
    setError("")
    try {
      const data: PaginatedResults<AdminReservation> = await apiAdminListReservations(
        accessToken,
        {
          page,
          page_size: PAGE_SIZE,
          search: debouncedSearch || undefined,
          ordering,
        }
      )
      setRows(data.results)
      setCount(data.count)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reservations")
      setRows([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [accessToken, page, debouncedSearch, ordering])

  React.useEffect(() => {
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const from = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, count)

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
        ordering === field
          ? "ascending"
          : ordering === `-${field}`
            ? "descending"
            : "none"
      }
    >
      {label}
      <SortIcon field={field} ordering={ordering} />
    </Button>
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Search email, name, ID number, or table #…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
          aria-label="Search reservations"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
        >
          Refresh
        </Button>
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
              <TableHead>{sortButton("user_name", "User")}</TableHead>
              <TableHead>{sortButton("user_email", "Email")}</TableHead>
              <TableHead className="w-[88px]">
                <div className="flex justify-end">
                  {sortButton("table_number", "Table")}
                </div>
              </TableHead>
              <TableHead>{sortButton("start_time", "Start")}</TableHead>
              <TableHead>{sortButton("end_time", "End")}</TableHead>
              <TableHead className="text-right">
                <div className="flex justify-end">
                  {sortButton("duration_minutes", "Min")}
                </div>
              </TableHead>
              <TableHead>{sortButton("created_at", "Created")}</TableHead>
              <TableHead className="text-right">
                <div className="flex justify-end">
                  {sortButton("is_available", "Active")}
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-24 text-center text-muted-foreground"
                >
                  No reservations match your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.id}
                  </TableCell>
                  <TableCell className="font-medium">{r.user_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {r.user_email}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    #{r.table_number}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                    {dt.format(new Date(r.start_time))}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                    {dt.format(new Date(r.end_time))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.duration_minutes}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                    {dt.format(new Date(r.created_at))}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.is_available ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/reservations/${r.id}`}>Details</Link>
                    </Button>
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
              ? "0 reservations"
              : `Showing ${from}–${to} of ${count}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="min-w-[5rem] text-center text-sm tabular-nums text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
