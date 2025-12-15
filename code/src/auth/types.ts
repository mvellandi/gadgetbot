/**
 * Shared authentication types
 *
 * These types are safe to import from both client and server code.
 * They match Better Auth's inferred types but don't depend on server-only modules.
 */

/**
 * User object from Better Auth
 */
export interface User {
	id: string
	email: string
	emailVerified: boolean
	name: string
	createdAt: Date
	updatedAt: Date
	image?: string | null
}

/**
 * Session object from Better Auth
 */
export interface Session {
	id: string
	userId: string
	expiresAt: Date
	token: string
	ipAddress?: string | null
	userAgent?: string | null
}
