import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { mockStudents } from "@/lib/data/admin-mock"

export const metadata: Metadata = {
  title: "Lecturer details",
  description: "View lecturer details",
}

function Field({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  )
}

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export default async function AdminLecturerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const s = mockStudents.find((x) => x.id === id && x.role === "lecturer")
  if (!s) notFound()

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/admin/lecturers">
            <ArrowLeft />
            Lecturers
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{s.name}</h1>
          <p className="text-muted-foreground">
            Demo-only details view (replace with API later).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User</CardTitle>
          <CardDescription>Backend-aligned fields from `User`.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="ID" value={<span className="font-mono text-xs">{s.id}</span>} />
          <Field label="Active" value={s.isActive ? "Yes" : "No"} />
          <Field label="Email" value={s.email} />
          <Field label="Role" value={<span className="capitalize">{s.role}</span>} />
          <Field
            label="ID number"
            value={<span className="font-mono text-xs">{s.idNumber}</span>}
          />
          <Field
            label="Date joined"
            value={formatter.format(new Date(s.dateJoined))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
