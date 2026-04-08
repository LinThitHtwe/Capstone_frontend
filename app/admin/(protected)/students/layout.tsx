import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Students",
  description: "Registered students (members)",
}

export default function AdminStudentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
