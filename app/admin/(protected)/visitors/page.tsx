"use client"

import { AdminVisitorsDataTable } from "@/components/admin/admin-visitors-data-table"

export default function AdminVisitorsPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Visitors</h1>
        <p className="text-muted-foreground">
          Accounts registered with the visitor role. Search, sort columns, and paginate.
        </p>
      </div>
      <AdminVisitorsDataTable />
    </div>
  )
}
