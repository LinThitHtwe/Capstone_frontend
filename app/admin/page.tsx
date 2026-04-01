import type { Metadata } from "next"
import { AdminHomeCharts } from "@/components/admin/admin-home-charts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  buildReservationsByDay,
  buildReservationsByStatus,
  buildStudentsByProgram,
} from "@/lib/data/admin-chart-data"
import { mockReservations, mockStudents } from "@/lib/data/admin-mock"

export const metadata: Metadata = {
  title: "Home",
  description: "Admin overview",
}

export default function AdminHomePage() {
  const upcoming = mockReservations.filter((r) => r.status === "confirmed").length
  const programData = buildStudentsByProgram(mockStudents)
  const statusData = buildReservationsByStatus(mockReservations)
  const timelineData = buildReservationsByDay(mockReservations)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="text-muted-foreground">
          Overview of students and reservations (sample data).
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Students</CardTitle>
            <CardDescription>Registered profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {mockStudents.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Reservations</CardTitle>
            <CardDescription>All history records</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {mockReservations.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Upcoming</CardTitle>
            <CardDescription>Confirmed, not yet completed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{upcoming}</p>
          </CardContent>
        </Card>
      </div>

      <AdminHomeCharts
        programData={programData}
        statusData={statusData}
        timelineData={timelineData}
      />
    </div>
  )
}
