import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Staff",
  description: "Registered staff accounts",
}

export default function AdminStaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
