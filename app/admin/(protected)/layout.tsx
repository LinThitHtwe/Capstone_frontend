import { AdminAuthGuard } from "@/components/admin/admin-auth-guard"
import { AdminShell } from "@/components/admin/admin-shell"

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthGuard>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGuard>
  )
}
