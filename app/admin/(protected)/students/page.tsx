"use client"

import { AdminStudentsDataTable } from "@/components/admin/admin-students-data-table"

export default function AdminStudentsPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
        <p className="text-muted-foreground">
          Members registered through signup. Search, sort columns, and paginate.
        </p>
      </div>
      <AdminStudentsDataTable />
    </div>
  )
}
