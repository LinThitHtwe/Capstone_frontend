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
import { mockReservations } from "@/lib/data/admin-mock"

export const metadata: Metadata = {
  title: "Reservation details",
  description: "View reservation details",
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

export default async function AdminReservationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const r = mockReservations.find((x) => x.id === id)
  if (!r) notFound()

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/admin/reservations">
            <ArrowLeft />
            Reservations
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reservation {r.id}
          </h1>
          <p className="text-muted-foreground">
            Demo-only details view (replace with API later).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reservation</CardTitle>
          <CardDescription>Backend-aligned fields from `Reservation`.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="ID" value={<span className="font-mono text-xs">{r.id}</span>} />
          <Field label="Available" value={r.isAvailable ? "Yes" : "No"} />
          <Field label="Start time" value={formatter.format(new Date(r.startTime))} />
          <Field label="End time" value={formatter.format(new Date(r.endTime))} />
          <Field label="Duration (minutes)" value={<span className="tabular-nums">{r.durationMinutes}</span>} />
          <Field label="OTP" value={<span className="font-mono tabular-nums">{r.otp}</span>} />
          <Field label="Created at" value={formatter.format(new Date(r.createdAt))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User & table</CardTitle>
          <CardDescription>Related display fields (demo).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="User name" value={r.userName} />
          <Field label="User email" value={r.userEmail} />
          <Field
            label="Table number"
            value={<span className="tabular-nums">#{r.tableNumber}</span>}
          />
        </CardContent>
      </Card>
    </div>
  )
}
