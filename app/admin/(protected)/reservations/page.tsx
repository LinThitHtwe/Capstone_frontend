import type { Metadata } from "next"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { mockReservations } from "@/lib/data/admin-mock"

export const metadata: Metadata = {
  title: "Reservation history",
  description: "View past and upcoming reservations",
}

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatRange(start: string, end: string) {
  return `${formatter.format(new Date(start))} → ${formatter.format(new Date(end))}`
}

export default function AdminReservationsPage() {
  const sorted = [...mockReservations].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reservation history
        </h1>
        <p className="text-muted-foreground">
          Read-only log. Newest reservations appear first.
        </p>
      </div>
      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {r.id}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{r.userName}</div>
                  <div className="text-xs text-muted-foreground">{r.userEmail}</div>
                </TableCell>
                <TableCell className="font-medium tabular-nums">
                  #{r.tableNumber}
                </TableCell>
                <TableCell className="max-w-[220px] text-muted-foreground">
                  {formatRange(r.startTime, r.endTime)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.durationMinutes}m
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/reservations/${encodeURIComponent(r.id)}`}>
                      Details
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
