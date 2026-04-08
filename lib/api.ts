const DEFAULT_SERVER_API = "http://127.0.0.1:8001"

/**
 * Full URL for an API path (no leading slash on `path`, e.g. `auth/login/`).
 * - Browser: if `NEXT_PUBLIC_API_URL` is unset, uses the Next.js rewrite `/django-api/*`
 *   (see `next.config.mjs`) to avoid CORS during local dev.
 * - Server: direct Django base URL.
 */
export function apiUrl(path: string): string {
  const slug = path.replace(/^\//, "")
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")
  if (configured) {
    return `${configured}/api/${slug}`
  }
  if (typeof window !== "undefined") {
    return `/django-api/${slug}`
  }
  return `${DEFAULT_SERVER_API}/api/${slug}`
}

export type LoginUser = {
  id: number
  email: string
  name: string
  role: string
  id_number: string
}

export type LoginResponse = {
  access: string
  refresh: string
  user: LoginUser
}

export type SignupBody = {
  email: string
  password: string
  password_confirm: string
  name: string
  id_number: string
}

export type SignupResponse = {
  id: number
  email: string
  name: string
  role: string
  id_number: string
}

function formatErrorPayload(data: unknown): string {
  if (data == null) return "Request failed"
  if (typeof data === "string") return data
  if (typeof data !== "object") return "Request failed"
  const obj = data as Record<string, unknown>
  if (typeof obj.detail === "string") return obj.detail
  if (Array.isArray(obj.detail)) {
    return obj.detail.map(String).join(" ")
  }
  const parts: string[] = []
  for (const [key, val] of Object.entries(obj)) {
    if (key === "detail") continue
    if (typeof val === "string") parts.push(`${key}: ${val}`)
    else if (Array.isArray(val)) parts.push(`${key}: ${val.map(String).join(", ")}`)
  }
  return parts.length ? parts.join(" ") : "Request failed"
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(apiUrl("auth/login/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(formatErrorPayload(data))
  const access = (data as LoginResponse).access
  const refresh = (data as LoginResponse).refresh
  const user = (data as LoginResponse).user
  if (typeof access !== "string" || typeof refresh !== "string") {
    throw new Error("Invalid login response")
  }
  if (
    !user ||
    typeof user !== "object" ||
    typeof (user as LoginUser).role !== "string"
  ) {
    throw new Error("Invalid login response: missing user.role")
  }
  return { access, refresh, user: user as LoginUser }
}

export async function apiSignup(body: SignupBody): Promise<SignupResponse> {
  const res = await fetch(apiUrl("auth/signup/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as SignupResponse
}

/** Attach Bearer token to future authenticated API calls. */
export function authHeaders(accessToken: string | null): HeadersInit {
  if (!accessToken) return {}
  return { Authorization: `Bearer ${accessToken}` }
}

export type AdminTable = {
  id: number
  table_number: number
  table_type: string
  library_floor: number
  position_x: number
  position_y: number
  is_reservable: boolean
  is_available: boolean
  weight_sensor_id: number | null
}

async function parseJson(res: Response): Promise<unknown> {
  return await res.json().catch(() => ({}))
}

export async function apiAdminListTables(accessToken: string): Promise<AdminTable[]> {
  const res = await fetch(apiUrl("admin/tables/"), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminTable[]
}

export async function apiAdminCreateTable(
  accessToken: string,
  body: Omit<AdminTable, "id">
): Promise<AdminTable> {
  const res = await fetch(apiUrl("admin/tables/"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(accessToken) },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminTable
}

export async function apiAdminUpdateTable(
  accessToken: string,
  id: number,
  body: Omit<AdminTable, "id">
): Promise<AdminTable> {
  const res = await fetch(apiUrl(`admin/tables/${id}/`), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(accessToken) },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminTable
}

export async function apiAdminDeleteTable(accessToken: string, id: number): Promise<void> {
  const res = await fetch(apiUrl(`admin/tables/${id}/`), {
    method: "DELETE",
    headers: { ...authHeaders(accessToken) },
  })
  if (res.status === 204) return
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
}
