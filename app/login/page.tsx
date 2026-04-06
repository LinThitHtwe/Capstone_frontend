"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (email === "test@mail.com" && password === "password123") {
      router.push("/")
      return
    }
    setError("Invalid email or password")
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
              Demo: <span className="font-mono text-xs">test@mail.com</span> /{" "}
              <span className="font-mono text-xs">password123</span>
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
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="login-password">Password</Label>
                  <span className="text-xs text-muted-foreground">
                    Demo only
                  </span>
                </div>
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

              <Button type="submit" className="w-full">
                Log in
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
