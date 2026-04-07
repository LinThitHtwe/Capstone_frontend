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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-8">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">← Library map</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-lg flex-col justify-center px-4 py-10 md:px-8">
        <Card className="shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl tracking-tight">Log in</CardTitle>
            <CardDescription>
              One account for library and admin. After sign-in you are sent
              where your role allows, using the role returned by the server.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </div>
              ) : null}

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Signing in…" : "Log in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
