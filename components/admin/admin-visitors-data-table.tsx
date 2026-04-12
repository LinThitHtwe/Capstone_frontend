"use client"

import { AdminDirectoryUsersDataTable } from "@/components/admin/admin-directory-users-data-table"
import { apiAdminListVisitors } from "@/lib/api"

export function AdminVisitorsDataTable() {
  return (
    <AdminDirectoryUsersDataTable
      listApi={apiAdminListVisitors}
      detailsPathForId={(id) => `/admin/visitors/${id}`}
      searchPlaceholder="Search name, email, or ID number…"
      searchAriaLabel="Search visitors"
      emptyMessage="No visitors match your filters."
      loadErrorMessage="Failed to load visitors"
      countNounZero="visitors"
    />
  )
}
