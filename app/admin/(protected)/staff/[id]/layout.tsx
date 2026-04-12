import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Staff details",
  description: "Staff profile",
}

export default function AdminStaffDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
