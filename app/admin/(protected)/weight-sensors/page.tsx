"use client"

import Link from "next/link"

import { AdminWeightSensorsDataTable } from "@/components/admin/admin-weight-sensors-data-table"

export default function AdminWeightSensorsPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Weight sensors</h1>
        <p className="text-muted-foreground">
          Register sensors by name and assign each to a table from this list or the{" "}
          <Link href="/admin/tables" className="font-medium text-primary underline-offset-2 hover:underline">
            tables map
          </Link>
          . The <span className="font-medium text-foreground">Available</span> column reflects live
          hardware state and cannot be changed from the admin UI.
        </p>
      </div>
      <AdminWeightSensorsDataTable />
    </div>
  )
}
