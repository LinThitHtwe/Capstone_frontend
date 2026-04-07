"use client"

import * as React from "react"

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, ROLE_ADMIN } from "@/lib/auth-config"
import {
  emailFromAccessToken,
  isAccessTokenExpired,
  roleFromAccessToken,
} from "@/lib/jwt"

type AuthContextValue = {
  accessToken: string | null
  refreshToken: string | null
  role: string | null
  email: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  hydrated: boolean
  setTokens: (access: string, refresh: string) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function readStoredTokens(): { access: string | null; refresh: string | null } {
  if (typeof window === "undefined") return { access: null, refresh: null }
  try {
    return {
      access: localStorage.getItem(ACCESS_TOKEN_KEY),
      refresh: localStorage.getItem(REFRESH_TOKEN_KEY),
    }
  } catch {
    return { access: null, refresh: null }
  }
}

function persistTokens(access: string | null, refresh: string | null) {
  try {
    if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access)
    else localStorage.removeItem(ACCESS_TOKEN_KEY)
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    else localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = React.useState<string | null>(null)
  const [refreshToken, setRefreshToken] = React.useState<string | null>(null)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const { access, refresh } = readStoredTokens()
    if (access && isAccessTokenExpired(access)) {
      persistTokens(null, null)
      setAccessToken(null)
      setRefreshToken(null)
    } else {
      setAccessToken(access)
      setRefreshToken(refresh)
    }
    setHydrated(true)
  }, [])

  const role = React.useMemo(
    () => (accessToken ? roleFromAccessToken(accessToken) : null),
    [accessToken]
  )
  const email = React.useMemo(
    () => (accessToken ? emailFromAccessToken(accessToken) : null),
    [accessToken]
  )

  const isAuthenticated = Boolean(accessToken && !isAccessTokenExpired(accessToken))
  const isAdmin = Boolean(
    isAuthenticated && role === ROLE_ADMIN
  )

  const setTokens = React.useCallback((access: string, refresh: string) => {
    persistTokens(access, refresh)
    setAccessToken(access)
    setRefreshToken(refresh)
  }, [])

  const logout = React.useCallback(() => {
    persistTokens(null, null)
    setAccessToken(null)
    setRefreshToken(null)
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      accessToken,
      refreshToken,
      role,
      email,
      isAuthenticated,
      isAdmin,
      hydrated,
      setTokens,
      logout,
    }),
    [
      accessToken,
      refreshToken,
      role,
      email,
      isAuthenticated,
      isAdmin,
      hydrated,
      setTokens,
      logout,
    ]
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
