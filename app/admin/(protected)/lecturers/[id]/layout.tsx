import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Lecturer details",
  description: "Lecturer profile",
}

export default function AdminLecturerDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
