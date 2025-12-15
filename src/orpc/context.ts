import type { Session, User } from "@/auth/types"

/**
 * oRPC Context Interface
 *
 * Available to all oRPC procedures via context parameter.
 * Contains authenticated session data when user is logged in.
 */
export interface Context {
	session: Session | null
	user: User | null
}
