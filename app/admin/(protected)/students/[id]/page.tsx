"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { ArrowLeft } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { apiAdminGetStudent, type AdminStudent } from "@/lib/api"

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

export default function AdminStudentDetailsPage() {
  const params = useParams()
  const idParam = params.id
  const idStr = Array.isArray(idParam) ? idParam[0] : idParam
  const idNum = idStr ? Number(idStr) : NaN

  const { accessToken } = useAuth()
  const [student, setStudent] = React.useState<AdminStudent | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (!accessToken || !Number.isFinite(idNum)) {
      setLoading(false)
      return
    }
    const token = accessToken
    let cancelled = false
    async function run() {
      setLoading(true)
      setError("")
      try {
        const data = await apiAdminGetStudent(token, idNum)
        if (!cancelled) setStudent(data)
      } catch (e) {
        if (!cancelled) {
          setStudent(null)
          setError(e instanceof Error ? e.message : "Failed to load student")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [accessToken, idNum])

  if (!Number.isFinite(idNum)) {
    return (
      <div className="w-full min-w-0 space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/admin/students">
            <ArrowLeft />
            Students
          </Link>
        </Button>
        <p className="text-sm text-destructive">Invalid student id.</p>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/admin/students">
            <ArrowLeft />
            Students
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {loading ? "Loading…" : student?.name ?? "Student"}
          </h1>
          <p className="text-muted-foreground">
            Profile from the library member account.
          </p>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      {!loading && student ? (
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Fields stored on the User model.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field
              label="ID"
              value={<span className="font-mono text-xs">{student.id}</span>}
            />
            <Field
              label="Active"
              value={student.is_active ? "Yes" : "No"}
            />
            <Field label="Email" value={student.email} />
            <Field label="Name" value={student.name} />
            <Field
              label="ID number"
              value={<span className="font-mono text-xs">{student.id_number}</span>}
            />
            <Field
              label="Date joined"
              value={formatter.format(new Date(student.date_joined))}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
