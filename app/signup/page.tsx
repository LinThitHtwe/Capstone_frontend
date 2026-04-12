"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiLogin, apiSignup } from "@/lib/api"
import { SIGNUP_ROLES, type SignupRole } from "@/lib/auth-config"
import { postLoginRedirectPath } from "@/lib/post-login-redirect"

export default function SignUpPage() {
  const router = useRouter()
  const { setTokens } = useAuth()
  const [name, setName] = React.useState("")
  const [idNumber, setIdNumber] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [role, setRole] = React.useState<SignupRole>("student")
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setPending(true)
    try {
      await apiSignup({
        email,
        password,
        password_confirm: confirmPassword,
        name,
        id_number: idNumber,
        role,
      })
      const tokens = await apiLogin(email, password)
      setTokens(tokens.access, tokens.refresh)
      router.replace(postLoginRedirectPath(tokens.user.role, null))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background md:min-h-[calc(100vh-4rem)]">
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-2xl flex-col items-center justify-center px-4 py-6 md:min-h-[calc(100vh-4rem)] md:px-8 md:py-8">
        <Card className="w-full shadow-md">
          <CardHeader className="space-y-1 pb-2 text-center">
            <CardTitle className="text-2xl tracking-tight">
              Create account
            </CardTitle>
            <CardDescription className="text-balance">
              Register for library reservation. Choose your role.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center px-6 pb-8 pt-2">
            <form
              onSubmit={handleSignUp}
              className="grid w-full max-w-xl grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2"
            >
              {error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive sm:col-span-2"
                >
                  {error}
                </div>
              ) : null}

              <div className="space-y-2 text-left">
                <Label htmlFor="signup-name">Full name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 text-left">
                <Label htmlFor="signup-role">Role</Label>
                <select
                  id="signup-role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={role}
                  onChange={(e) => setRole(e.target.value as SignupRole)}
                  required
                  aria-label="Account role"
                >
                  {SIGNUP_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-left">
                <Label htmlFor="signup-id">ID number</Label>
                <Input
                  id="signup-id"
                  type="text"
                  autoComplete="off"
                  placeholder="Student, staff, or visitor ID"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 text-left">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 text-left">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <div className="space-y-2 text-left">
                <Label htmlFor="signup-confirm">Confirm password</Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full sm:col-span-2"
                disabled={pending}
              >
                {pending ? "Creating account…" : "Sign up"}
              </Button>
            </form>

            <p className="mt-10 w-full max-w-xl text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
