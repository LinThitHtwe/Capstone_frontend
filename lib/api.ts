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
  role: string
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

export type AdminTableLcdDisplayRef = {
  id: number
  lcd_type: string
}

/** Matches backend ``api.constants`` — ``Table.status``. */
export const TABLE_STATUS_FREE = 1
export const TABLE_STATUS_OCCUPIED = 2
export const TABLE_STATUS_RESERVED = 3

export type AdminTable = {
  id: number
  table_number: number
  table_type: string
  library_floor: number
  position_x: number
  position_y: number
  is_reservable: boolean
  is_available: boolean
  /** 1=free, 2=occupied, 3=reserved (see ``TABLE_STATUS_*``). */
  status: number
  weight_sensor_id: number | null
  /** Read-only: seated per linked weight sensor; null if no sensor. */
  sensor_seated?: boolean | null
  /** Read-only: LCD row linked to this table (OneToOne from LCD side). */
  lcd_display?: AdminTableLcdDisplayRef | null
}

/** Payload for create/update (no read-only server fields). */
export type AdminTableUpsertBody = Omit<
  AdminTable,
  "id" | "sensor_seated" | "lcd_display"
> & {
  lcd_display_id: number | null
}

async function parseJson(res: Response): Promise<unknown> {
  return await res.json().catch(() => ({}))
}

/**
 * Public library map (no auth). Same row shape as admin table without weight_sensor_id,
 * plus live seating from the linked weight sensor when present.
 */
export type PublicTable = Omit<AdminTable, "weight_sensor_id"> & {
  /** From weight sensor when linked; null if no sensor (client may simulate demo). */
  sensor_seated?: boolean | null
}

export async function apiPublicListTables(): Promise<PublicTable[]> {
  const res = await fetch(apiUrl("tables/"), { cache: "no-store" })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as PublicTable[]
}

export type PublicMapReservation = {
  id: number
  table_number: number
  start_time: string
  end_time: string
}

export async function apiPublicMapReservations(): Promise<PublicMapReservation[]> {
  const res = await fetch(apiUrl("map-reservations/"), { cache: "no-store" })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as PublicMapReservation[]
}

export type UserReservation = {
  id: number
  table_id: number
  table_number: number
  start_time: string
  end_time: string
  duration_minutes: number
  created_at: string
}

export type UserReservationCreateBody = {
  table_id: number
  reservation_date: string
  start_local: string
  end_local: string
}

export async function apiMeListReservations(accessToken: string): Promise<UserReservation[]> {
  const res = await fetch(apiUrl("me/reservations/"), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as UserReservation[]
}

export async function apiMeCreateReservation(
  accessToken: string,
  body: UserReservationCreateBody
): Promise<UserReservation> {
  const res = await fetch(apiUrl("me/reservations/"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(accessToken) },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as UserReservation
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
  body: AdminTableUpsertBody
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
  body: AdminTableUpsertBody
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

export type AdminStudent = {
  id: number
  email: string
  name: string
  id_number: string
  date_joined: string
  is_active: boolean
}

export type PaginatedResults<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function apiAdminListStudents(
  accessToken: string,
  params: {
    page?: number
    page_size?: number
    search?: string
    ordering?: string
  } = {}
): Promise<PaginatedResults<AdminStudent>> {
  const sp = new URLSearchParams()
  if (params.page != null) sp.set("page", String(params.page))
  if (params.page_size != null) sp.set("page_size", String(params.page_size))
  if (params.search) sp.set("search", params.search)
  if (params.ordering) sp.set("ordering", params.ordering)
  const q = sp.toString()
  const path = q ? `admin/students/?${q}` : "admin/students/"
  const res = await fetch(apiUrl(path), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as PaginatedResults<AdminStudent>
}

export async function apiAdminGetStudent(
  accessToken: string,
  id: number
): Promise<AdminStudent> {
  const res = await fetch(apiUrl(`admin/students/${id}/`), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminStudent
}

export async function apiAdminListStaff(
  accessToken: string,
  params: {
    page?: number
    page_size?: number
    search?: string
    ordering?: string
  } = {}
): Promise<PaginatedResults<AdminStudent>> {
  const sp = new URLSearchParams()
  if (params.page != null) sp.set("page", String(params.page))
  if (params.page_size != null) sp.set("page_size", String(params.page_size))
  if (params.search) sp.set("search", params.search)
  if (params.ordering) sp.set("ordering", params.ordering)
  const q = sp.toString()
  const path = q ? `admin/staff/?${q}` : "admin/staff/"
  const res = await fetch(apiUrl(path), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as PaginatedResults<AdminStudent>
}

export async function apiAdminGetStaff(
  accessToken: string,
  id: number
): Promise<AdminStudent> {
  const res = await fetch(apiUrl(`admin/staff/${id}/`), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminStudent
}

export async function apiAdminListLecturers(
  accessToken: string,
  params: {
    page?: number
    page_size?: number
    search?: string
    ordering?: string
  } = {}
): Promise<PaginatedResults<AdminStudent>> {
  const sp = new URLSearchParams()
  if (params.page != null) sp.set("page", String(params.page))
  if (params.page_size != null) sp.set("page_size", String(params.page_size))
  if (params.search) sp.set("search", params.search)
  if (params.ordering) sp.set("ordering", params.ordering)
  const q = sp.toString()
  const path = q ? `admin/lecturers/?${q}` : "admin/lecturers/"
  const res = await fetch(apiUrl(path), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as PaginatedResults<AdminStudent>
}

export async function apiAdminGetLecturer(
  accessToken: string,
  id: number
): Promise<AdminStudent> {
  const res = await fetch(apiUrl(`admin/lecturers/${id}/`), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminStudent
}

export async function apiAdminListVisitors(
  accessToken: string,
  params: {
    page?: number
    page_size?: number
    search?: string
    ordering?: string
  } = {}
): Promise<PaginatedResults<AdminStudent>> {
  const sp = new URLSearchParams()
  if (params.page != null) sp.set("page", String(params.page))
  if (params.page_size != null) sp.set("page_size", String(params.page_size))
  if (params.search) sp.set("search", params.search)
  if (params.ordering) sp.set("ordering", params.ordering)
  const q = sp.toString()
  const path = q ? `admin/visitors/?${q}` : "admin/visitors/"
  const res = await fetch(apiUrl(path), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as PaginatedResults<AdminStudent>
}

export async function apiAdminGetVisitor(
  accessToken: string,
  id: number
): Promise<AdminStudent> {
  const res = await fetch(apiUrl(`admin/visitors/${id}/`), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminStudent
}

export type AdminReservation = {
  id: number
  user_id: number
  user_email: string
  user_name: string
  table_id: number
  table_number: number
  start_time: string
  end_time: string
  duration_minutes: number
  is_available: boolean
  otp: string
  created_at: string
  reminder_sent_at: string | null
  overstay_alert_sent_at: string | null
}

export async function apiAdminListReservations(
  accessToken: string,
  params: {
    page?: number
    page_size?: number
    search?: string
    ordering?: string
  } = {}
): Promise<PaginatedResults<AdminReservation>> {
  const sp = new URLSearchParams()
  if (params.page != null) sp.set("page", String(params.page))
  if (params.page_size != null) sp.set("page_size", String(params.page_size))
  if (params.search) sp.set("search", params.search)
  if (params.ordering) sp.set("ordering", params.ordering)
  const q = sp.toString()
  const path = q ? `admin/reservations/?${q}` : "admin/reservations/"
  const res = await fetch(apiUrl(path), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as PaginatedResults<AdminReservation>
}

export async function apiAdminGetReservation(
  accessToken: string,
  id: number
): Promise<AdminReservation> {
  const res = await fetch(apiUrl(`admin/reservations/${id}/`), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminReservation
}

export type AdminWeightSensorAssignedTable = {
  id: number
  table_number: number
  library_floor: number
  /** More than one table points at this sensor (misconfiguration). */
  also_linked_count?: number
}

export type AdminWeightSensor = {
  id: number
  name: string
  last_reading_at: string | null
  is_available: boolean
  /** Primary linked table (lowest table number), if any. */
  assigned_table?: AdminWeightSensorAssignedTable | null
}

export type AdminLCDDisplayAssignedTable = {
  id: number
  table_number: number
  library_floor: number
}

export type AdminLCDDisplay = {
  id: number
  lcd_type: string
  table_id: number | null
  /** Denormalized from linked table (same as table_id). */
  assigned_table?: AdminLCDDisplayAssignedTable | null
  recorded_at: string | null
  is_available: boolean
}

export async function apiAdminListWeightSensors(
  accessToken: string
): Promise<AdminWeightSensor[]> {
  const res = await fetch(apiUrl("admin/weight-sensors/"), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminWeightSensor[]
}

export async function apiAdminCreateWeightSensor(
  accessToken: string,
  body: Pick<AdminWeightSensor, "name"> & {
    /** Assign this sensor to a table (clears other tables using this sensor). */
    table_id?: number | null
  }
): Promise<AdminWeightSensor> {
  const res = await fetch(apiUrl("admin/weight-sensors/"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(accessToken) },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminWeightSensor
}

export async function apiAdminUpdateWeightSensor(
  accessToken: string,
  id: number,
  body: Partial<Pick<AdminWeightSensor, "name"> & { table_id?: number | null }>
): Promise<AdminWeightSensor> {
  const res = await fetch(apiUrl(`admin/weight-sensors/${id}/`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(accessToken) },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminWeightSensor
}

export async function apiAdminDeleteWeightSensor(
  accessToken: string,
  id: number
): Promise<void> {
  const res = await fetch(apiUrl(`admin/weight-sensors/${id}/`), {
    method: "DELETE",
    headers: { ...authHeaders(accessToken) },
  })
  if (res.status === 204) return
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
}

export async function apiAdminListLCDDisplays(
  accessToken: string
): Promise<AdminLCDDisplay[]> {
  const res = await fetch(apiUrl("admin/lcd-displays/"), {
    headers: { ...authHeaders(accessToken) },
    cache: "no-store",
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminLCDDisplay[]
}

export async function apiAdminCreateLCDDisplay(
  accessToken: string,
  body: Pick<AdminLCDDisplay, "lcd_type"> & {
    table_id?: number | null
  }
): Promise<AdminLCDDisplay> {
  const res = await fetch(apiUrl("admin/lcd-displays/"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(accessToken) },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminLCDDisplay
}

export async function apiAdminUpdateLCDDisplay(
  accessToken: string,
  id: number,
  body: Partial<Pick<AdminLCDDisplay, "lcd_type" | "table_id">>
): Promise<AdminLCDDisplay> {
  const res = await fetch(apiUrl(`admin/lcd-displays/${id}/`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(accessToken) },
    body: JSON.stringify(body),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
  return data as AdminLCDDisplay
}

export async function apiAdminDeleteLCDDisplay(
  accessToken: string,
  id: number
): Promise<void> {
  const res = await fetch(apiUrl(`admin/lcd-displays/${id}/`), {
    method: "DELETE",
    headers: { ...authHeaders(accessToken) },
  })
  if (res.status === 204) return
  const data = await parseJson(res)
  if (!res.ok) throw new Error(formatErrorPayload(data))
}
