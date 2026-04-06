"use client"

import * as React from "react"
import Link from "next/link"

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

export default function SignUpPage() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitted(false)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitted(true)
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
            <CardTitle className="text-2xl tracking-tight">
              Create account
            </CardTitle>
            <CardDescription>
              Sign up for library access. This form is a UI demo only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              {error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </div>
              ) : null}

              {submitted && !error ? (
                <div
                  role="status"
                  className="rounded-lg border border-green-600/30 bg-green-500/10 px-3 py-2 text-sm text-green-800 dark:border-green-500/35 dark:bg-green-500/15 dark:text-green-200"
                >
                  Details captured (demo). Backend registration is not wired
                  yet.
                </div>
              ) : null}

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm">Confirm password</Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Sign up
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
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
