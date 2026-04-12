"use client"

import { AdminReservationsDataTable } from "@/components/admin/admin-reservations-data-table"

export default function AdminReservationsPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reservation history
        </h1>
        <p className="text-muted-foreground">
          Live data from the database. Search, sort columns, and paginate.
        </p>
      </div>
      <AdminReservationsDataTable />
    </div>
  )
}
