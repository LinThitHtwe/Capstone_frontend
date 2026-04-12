import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Lecturers",
  description: "Registered lecturer accounts",
}

export default function AdminLecturersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
