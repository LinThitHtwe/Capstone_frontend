import type { Metadata } from "next"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

const statusLabel: Record<(typeof mockReservations)[number]["status"], string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
}

export default function AdminReservationsPage() {
  const sorted = [...mockReservations].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
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
              <TableHead>Student</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {r.id}
                </TableCell>
                <TableCell className="font-medium">{r.studentName}</TableCell>
                <TableCell>{r.resource}</TableCell>
                <TableCell className="max-w-[220px] text-muted-foreground">
                  {formatRange(r.startAt, r.endAt)}
                </TableCell>
                <TableCell className="text-right">{statusLabel[r.status]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
