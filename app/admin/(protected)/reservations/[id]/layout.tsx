import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reservation details",
  description: "Reservation record",
}

export default function AdminReservationDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
