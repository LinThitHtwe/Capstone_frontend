"use client"

import Link from "next/link"

import { AdminLCDDisplaysDataTable } from "@/components/admin/admin-lcd-displays-data-table"

export default function AdminLCDDisplaysPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">LCD displays</h1>
        <p className="text-muted-foreground">
          Register displays by type and assign each to a table from this list (add or edit) or the{" "}
          <Link href="/admin/tables" className="font-medium text-primary underline-offset-2 hover:underline">
            tables map
          </Link>
          . The <span className="font-medium text-foreground">Available</span> column is read-only
          here; it is updated by the device or backend logic, not by admins.
        </p>
      </div>
      <AdminLCDDisplaysDataTable />
    </div>
  )
}
