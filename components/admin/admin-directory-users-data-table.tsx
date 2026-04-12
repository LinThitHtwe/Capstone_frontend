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
import type { AdminStudent, PaginatedResults } from "@/lib/api"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 15

type SortField = "id" | "name" | "email" | "id_number" | "date_joined" | "is_active"

type ListParams = {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
}

export type AdminDirectoryUsersDataTableProps = {
  listApi: (
    accessToken: string,
    params: ListParams
  ) => Promise<PaginatedResults<AdminStudent>>
  detailsPathForId: (id: number) => string
  searchPlaceholder: string
  searchAriaLabel: string
  emptyMessage: string
  loadErrorMessage: string
  countNounZero: string
}

function nextOrdering(current: string, field: SortField): string {
  if (current === field) return `-${field}`
  if (current === `-${field}`) return field
  if (field === "date_joined" || field === "id" || field === "is_active") {
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

export function AdminDirectoryUsersDataTable({
  listApi,
  detailsPathForId,
  searchPlaceholder,
  searchAriaLabel,
  emptyMessage,
  loadErrorMessage,
  countNounZero,
}: AdminDirectoryUsersDataTableProps) {
  const { accessToken } = useAuth()
  const [rows, setRows] = React.useState<AdminStudent[]>([])
  const [count, setCount] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [ordering, setOrdering] = React.useState("-date_joined")
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
      const data = await listApi(accessToken, {
        page,
        page_size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        ordering,
      })
      setRows(data.results)
      setCount(data.count)
    } catch (e) {
      setError(e instanceof Error ? e.message : loadErrorMessage)
      setRows([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [
    accessToken,
    page,
    debouncedSearch,
    ordering,
    listApi,
    loadErrorMessage,
  ])

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
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
          aria-label={searchAriaLabel}
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
              <TableHead>{sortButton("name", "Name")}</TableHead>
              <TableHead>{sortButton("email", "Email")}</TableHead>
              <TableHead>{sortButton("id_number", "ID number")}</TableHead>
              <TableHead>{sortButton("date_joined", "Joined")}</TableHead>
              <TableHead className="text-right">
                <div className="flex justify-end">
                  {sortButton("is_active", "Active")}
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {s.id}
                  </TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell className="font-mono text-xs">{s.id_number}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {dt.format(new Date(s.date_joined))}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.is_active ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={detailsPathForId(s.id)}>Details</Link>
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
              ? `0 ${countNounZero}`
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
