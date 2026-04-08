import {
  ROLE_ADMIN,
  ROLE_LECTURER,
  ROLE_MEMBER,
  ROLE_STAFF,
  ROLE_STUDENT,
  ROLE_VISITOR,
  isPublicLibraryRole,
} from "@/lib/auth-config"

function normalizeRole(role: string): string {
  return role.trim().toLowerCase()
}

/**
 * Default landing path when there is no safe `from` query (per role).
 * Admin → dashboard; students/members → reservations; other public roles → home map.
 */
function defaultHomeForRole(role: string): string {
  switch (role) {
    case ROLE_ADMIN:
      return "/admin"
    case ROLE_STUDENT:
    case ROLE_MEMBER:
      return "/reservations"
    case ROLE_LECTURER:
    case ROLE_STAFF:
    case ROLE_VISITOR:
      return "/"
    default:
      return "/"
  }
}

/**
 * Where to send the user after a successful login, using backend `user.role`
 * and optional `from` (deep link). Non-admin roles never land on `/admin/*`.
 */
export function postLoginRedirectPath(
  role: string,
  fromParam: string | null
): string {
  const r = normalizeRole(role)
  const from =
    fromParam && fromParam.startsWith("/") ? fromParam : null

  if (r === ROLE_ADMIN) {
    if (from?.startsWith("/admin")) return from
    return "/admin"
  }

  if (isPublicLibraryRole(r)) {
    if (from?.startsWith("/admin")) return defaultHomeForRole(r)
    if (from) return from
    return defaultHomeForRole(r)
  }

  if (from?.startsWith("/admin")) return "/"
  if (from) return from
  return "/"
}
