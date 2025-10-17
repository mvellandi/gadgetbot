import { auth } from "@/auth/server"
import type { Session, User } from "@/auth/server"

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

/**
 * Create oRPC context from request headers
 *
 * Extracts the Better Auth session from request headers/cookies.
 * Called by oRPC HTTP handler for every request.
 *
 * @param request - The incoming HTTP request
 * @returns Context object with session and user data
 */
export async function createContext(
	request: Request,
): Promise<Context> {
	try {
		// Extract session from Better Auth
		const session = await auth.api.getSession({ headers: request.headers })

		return {
			session: session?.session || null,
			user: session?.user || null,
		}
	} catch (error) {
		// If session extraction fails, return null session
		console.error("Failed to extract session:", error)
		return {
			session: null,
			user: null,
		}
	}
}
