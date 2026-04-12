import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reservation history",
  description: "Library reservations from the database",
}

export default function AdminReservationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
