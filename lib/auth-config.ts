export const ACCESS_TOKEN_KEY = "capstone_access"
export const REFRESH_TOKEN_KEY = "capstone_refresh"

/** Align with `api.constants` role strings. */
export const ROLE_ADMIN = "admin"
/** Legacy accounts; new signups use `student`. */
export const ROLE_MEMBER = "member"
export const ROLE_STUDENT = "student"
export const ROLE_LECTURER = "lecturer"
export const ROLE_STAFF = "staff"
export const ROLE_VISITOR = "visitor"

/** Must match backend `api.constants.PUBLIC_SIGNUP_ROLES`. */
export const SIGNUP_ROLES = [
  { value: ROLE_STUDENT, label: "Student" },
  { value: ROLE_LECTURER, label: "Lecturer" },
  { value: ROLE_STAFF, label: "Staff" },
  { value: ROLE_VISITOR, label: "Visitor" },
] as const

export type SignupRole = (typeof SIGNUP_ROLES)[number]["value"]

/** Non-admin roles that use the public site after login. */
export const PUBLIC_LIBRARY_ROLES = [
  ROLE_STUDENT,
  ROLE_MEMBER,
  ROLE_LECTURER,
  ROLE_STAFF,
  ROLE_VISITOR,
] as const

export function isPublicLibraryRole(role: string): boolean {
  return (PUBLIC_LIBRARY_ROLES as readonly string[]).includes(role)
}

const ROLE_LABELS: Record<string, string> = {
  [ROLE_ADMIN]: "Admin",
  [ROLE_MEMBER]: "Student",
  [ROLE_STUDENT]: "Student",
  [ROLE_LECTURER]: "Lecturer",
  [ROLE_STAFF]: "Staff",
  [ROLE_VISITOR]: "Visitor",
}

/** Human-readable label for header / UI; `member` shown as Student. */
export function formatRoleLabel(role: string | null | undefined): string | null {
  if (role == null || role === "") return null
  const key = role.trim().toLowerCase()
  return ROLE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}
