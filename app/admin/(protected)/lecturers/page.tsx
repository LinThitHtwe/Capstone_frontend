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
import { mockStudents } from "@/lib/data/admin-mock"

export const metadata: Metadata = {
  title: "Lecturers",
  description: "View registered lecturers",
}

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export default function AdminLecturersPage() {
  const lecturers = mockStudents.filter((u) => u.role === "lecturer")

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lecturers</h1>
        <p className="text-muted-foreground">
          Read-only list. Replace mock data with your API response.
        </p>
      </div>
      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>ID number</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lecturers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {s.id}
                </TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell className="capitalize">{s.role}</TableCell>
                <TableCell className="font-mono text-xs">{s.idNumber}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatter.format(new Date(s.dateJoined))}
                </TableCell>
                <TableCell className="text-right">
                  {s.isActive ? "Yes" : "No"}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/lecturers/${encodeURIComponent(s.id)}`}>
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
