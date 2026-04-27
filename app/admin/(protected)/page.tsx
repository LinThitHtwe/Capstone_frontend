import type { Metadata } from "next"
import { AdminHomeDashboard } from "@/components/admin/admin-home-dashboard"
import { AdminLibraryOccupancy } from "@/components/admin/admin-library-occupancy"
import { LibraryMapExperienceCard } from "@/components/library/library-map-experience-card"

export const metadata: Metadata = {
  title: "Home",
  description: "Admin overview",
}

export default function AdminHomePage() {
  return (
    <div className="w-full min-w-0 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="text-muted-foreground">
          Overview of users and reservations from the live API.
        </p>
      </div>

      <AdminLibraryOccupancy />

      <LibraryMapExperienceCard variant="admin" />

      <AdminHomeDashboard />
    </div>
  )
}
