import { createAuthClient } from "better-auth/react"

/**
 * Better Auth client for React
 *
 * Provides:
 * - useSession() hook for accessing session data
 * - signIn methods for authentication
 * - signOut() for logging out
 * - Social provider authentication
 */
export const authClient = createAuthClient({
	// Always use window.location.origin (client-side) or process.env for SSR
	// Don't import env module here as it validates server-only vars (DATABASE_URL)
	baseURL: typeof window !== "undefined"
		? window.location.origin
		: process.env.BETTER_AUTH_URL || "http://localhost:3000",
})

/**
 * Export commonly used hooks and methods
 */
export const { useSession, signIn, signOut, signUp } = authClient
