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
import { apiAdminGetReservation, type AdminReservation } from "@/lib/api"

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

function formatMaybe(iso: string | null) {
  if (iso == null || iso === "") return "—"
  return formatter.format(new Date(iso))
}

export default function AdminReservationDetailsPage() {
  const params = useParams()
  const idParam = params.id
  const idStr = Array.isArray(idParam) ? idParam[0] : idParam
  const idNum = idStr ? Number(idStr) : NaN

  const { accessToken } = useAuth()
  const [r, setR] = React.useState<AdminReservation | null>(null)
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
        const data = await apiAdminGetReservation(token, idNum)
        if (!cancelled) setR(data)
      } catch (e) {
        if (!cancelled) {
          setR(null)
          setError(e instanceof Error ? e.message : "Failed to load reservation")
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
          <Link href="/admin/reservations">
            <ArrowLeft />
            Reservations
          </Link>
        </Button>
        <p className="text-sm text-destructive">Invalid reservation id.</p>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/admin/reservations">
            <ArrowLeft />
            Reservations
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {loading ? "Loading…" : r ? `Reservation #${r.id}` : "Reservation"}
          </h1>
          <p className="text-muted-foreground">
            Read-only record from the database.
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

      {!loading && r ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Reservation</CardTitle>
              <CardDescription>Core fields on the reservation row.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <Field
                label="ID"
                value={<span className="font-mono text-xs">{r.id}</span>}
              />
              <Field
                label="Active"
                value={r.is_available ? "Yes" : "No"}
              />
              <Field
                label="Start time"
                value={formatter.format(new Date(r.start_time))}
              />
              <Field
                label="End time"
                value={formatter.format(new Date(r.end_time))}
              />
              <Field
                label="Duration (minutes)"
                value={<span className="tabular-nums">{r.duration_minutes}</span>}
              />
              <Field
                label="OTP"
                value={
                  r.otp ? (
                    <span className="font-mono tabular-nums">{r.otp}</span>
                  ) : (
                    "—"
                  )
                }
              />
              <Field
                label="Created at"
                value={formatter.format(new Date(r.created_at))}
              />
              <Field label="Reminder sent" value={formatMaybe(r.reminder_sent_at)} />
              <Field
                label="Overstay alert sent"
                value={formatMaybe(r.overstay_alert_sent_at)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User & table</CardTitle>
              <CardDescription>Related account and table.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <Field
                label="User ID"
                value={<span className="font-mono text-xs">{r.user_id}</span>}
              />
              <Field label="User name" value={r.user_name} />
              <Field label="User email" value={r.user_email} />
              <Field
                label="Table ID"
                value={<span className="font-mono text-xs">{r.table_id}</span>}
              />
              <Field
                label="Table number"
                value={<span className="tabular-nums">#{r.table_number}</span>}
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
