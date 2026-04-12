import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Visitors",
  description: "Registered visitor accounts",
}

export default function AdminVisitorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
