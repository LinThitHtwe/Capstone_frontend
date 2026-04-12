"use client"

import { AdminLecturersDataTable } from "@/components/admin/admin-lecturers-data-table"

export default function AdminLecturersPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lecturers</h1>
        <p className="text-muted-foreground">
          Accounts registered with the lecturer role. Search, sort columns, and paginate.
        </p>
      </div>
      <AdminLecturersDataTable />
    </div>
  )
}
