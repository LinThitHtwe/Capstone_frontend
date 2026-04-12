"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiLogin } from "@/lib/api"
import { postLoginRedirectPath } from "@/lib/post-login-redirect"

function readFromQuery(): string | null {
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get("from")
}

export default function LoginPage() {
  const router = useRouter()
  const { setTokens } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [pending, setPending] = React.useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setPending(true)
    try {
      const result = await apiLogin(email, password)
      setTokens(result.access, result.refresh)
      const target = postLoginRedirectPath(result.user.role, readFromQuery())
      router.replace(target)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background md:min-h-[calc(100vh-4rem)]">
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-lg flex-col items-center justify-center px-4 py-6 md:min-h-[calc(100vh-4rem)] md:px-8 md:py-8">
        <Card className="w-full max-w-md shadow-md">
          <CardHeader className="space-y-1 pb-2 text-center">
            <CardTitle className="text-2xl tracking-tight">Sign in</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center px-6 pb-8 pt-2">
            <form
              onSubmit={handleLogin}
              className="flex w-full max-w-sm flex-col gap-8"
            >
              {error ? (
                <div
                  role="alert"
                  className="w-full rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
                >
                  {error}
                </div>
              ) : null}

              <div className="w-full space-y-2 text-left">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="w-full space-y-2 text-left">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  //minLength={8}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="mt-10 w-full max-w-sm text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Create account
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
