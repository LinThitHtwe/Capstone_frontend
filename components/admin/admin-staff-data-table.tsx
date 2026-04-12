"use client"

import { AdminDirectoryUsersDataTable } from "@/components/admin/admin-directory-users-data-table"
import { apiAdminListStaff } from "@/lib/api"

export function AdminStaffDataTable() {
  return (
    <AdminDirectoryUsersDataTable
      listApi={apiAdminListStaff}
      detailsPathForId={(id) => `/admin/staff/${id}`}
      searchPlaceholder="Search name, email, or ID number…"
      searchAriaLabel="Search staff"
      emptyMessage="No staff match your filters."
      loadErrorMessage="Failed to load staff"
      countNounZero="staff"
    />
  )
}
