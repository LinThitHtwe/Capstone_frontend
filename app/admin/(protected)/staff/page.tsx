"use client"

import { AdminStaffDataTable } from "@/components/admin/admin-staff-data-table"

export default function AdminStaffPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
        <p className="text-muted-foreground">
          Accounts registered with the staff role. Search, sort columns, and paginate.
        </p>
      </div>
      <AdminStaffDataTable />
    </div>
  )
}
