"use client"

import { AdminDirectoryUsersDataTable } from "@/components/admin/admin-directory-users-data-table"
import { apiAdminListLecturers } from "@/lib/api"

export function AdminLecturersDataTable() {
  return (
    <AdminDirectoryUsersDataTable
      listApi={apiAdminListLecturers}
      detailsPathForId={(id) => `/admin/lecturers/${id}`}
      searchPlaceholder="Search name, email, or ID number…"
      searchAriaLabel="Search lecturers"
      emptyMessage="No lecturers match your filters."
      loadErrorMessage="Failed to load lecturers"
      countNounZero="lecturers"
    />
  )
}
