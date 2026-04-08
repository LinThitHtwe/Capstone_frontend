import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Student details",
  description: "Student profile",
}

export default function AdminStudentDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
