"use client"

import { AdminDirectoryUsersDataTable } from "@/components/admin/admin-directory-users-data-table"
import { apiAdminListStudents } from "@/lib/api"

export function AdminStudentsDataTable() {
  return (
    <AdminDirectoryUsersDataTable
      listApi={apiAdminListStudents}
      detailsPathForId={(id) => `/admin/students/${id}`}
      searchPlaceholder="Search name, email, or ID number…"
      searchAriaLabel="Search students"
      emptyMessage="No students match your filters."
      loadErrorMessage="Failed to load students"
      countNounZero="students"
    />
  )
}
