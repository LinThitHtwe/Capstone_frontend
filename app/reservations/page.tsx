import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDemoStudentReservationsSorted } from "@/lib/data/demo-user-reservations"

export const metadata: Metadata = {
  title: "My reservations",
  description: "Your reservation history",
}

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatRange(start: string, end: string) {
  return `${formatter.format(new Date(start))} → ${formatter.format(new Date(end))}`
}

export default function StudentReservationsPage() {
  const sorted = getDemoStudentReservationsSorted()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">← Home</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            My reservation history
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All reservations</CardTitle>
            <CardDescription>Newest first.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <div className="rounded-xl border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No reservations yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {r.id}
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          #{r.tableNumber}
                        </TableCell>
                        <TableCell className="max-w-[240px] text-muted-foreground">
                          {formatRange(r.startTime, r.endTime)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.durationMinutes}m
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
