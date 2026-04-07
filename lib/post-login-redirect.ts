import { ROLE_ADMIN } from "@/lib/auth-config"

/**
 * Where to send the user after a successful login, using backend `user.role`
 * and optional `from` (deep link). Members never land on `/admin/*`.
 */
export function postLoginRedirectPath(
  role: string,
  fromParam: string | null
): string {
  const from =
    fromParam && fromParam.startsWith("/") ? fromParam : null

  if (role === ROLE_ADMIN) {
    if (from?.startsWith("/admin")) return from
    return "/admin"
  }

  if (from?.startsWith("/admin")) return "/"
  if (from) return from
  return "/"
}
