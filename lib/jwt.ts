/**
 * Decode JWT payload (no signature verification — for UI routing only).
 * Authorization is enforced by the backend on every API call.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null
    const payload = parts[1]
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const pad = (4 - (b64.length % 4)) % 4
    const padded = b64 + "=".repeat(pad)
    const json = atob(padded)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export function jwtExpSeconds(token: string): number | null {
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== "number") return null
  return payload.exp
}

/** Returns true if token is missing or expired (with 30s skew). */
export function isAccessTokenExpired(token: string | null): boolean {
  if (!token) return true
  const exp = jwtExpSeconds(token)
  if (exp == null) return true
  const now = Math.floor(Date.now() / 1000)
  return exp <= now + 30
}

export function roleFromAccessToken(token: string | null): string | null {
  if (!token) return null
  const payload = decodeJwtPayload(token)
  const role = payload?.role
  return typeof role === "string" ? role : null
}

export function emailFromAccessToken(token: string | null): string | null {
  if (!token) return null
  const payload = decodeJwtPayload(token)
  const email = payload?.email
  return typeof email === "string" ? email : null
}
