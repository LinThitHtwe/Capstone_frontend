export const ACCESS_TOKEN_KEY = "capstone_access"
export const REFRESH_TOKEN_KEY = "capstone_refresh"

/** Must match backend `api.constants.ROLE_ADMIN`. */
export const ROLE_ADMIN = "admin"

/** Must match backend `api.constants.PUBLIC_SIGNUP_ROLES`. */
export const SIGNUP_ROLES = [
  { value: "student", label: "Student" },
  { value: "lecturer", label: "Lecturer" },
  { value: "staff", label: "Staff" },
  { value: "visitor", label: "Visitor" },
] as const

export type SignupRole = (typeof SIGNUP_ROLES)[number]["value"]
