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
	baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
})

/**
 * Export commonly used hooks and methods
 */
export const { useSession, signIn, signOut, signUp } = authClient
