import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Visitor details",
  description: "Visitor profile",
}

export default function AdminVisitorDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
