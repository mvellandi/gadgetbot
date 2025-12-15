import { createFileRoute } from "@tanstack/react-router"
import { auth } from "@/auth/server"

/**
 * Better Auth API handler
 *
 * Catch-all route for all auth endpoints:
 * - /api/auth/sign-in/*
 * - /api/auth/sign-out
 * - /api/auth/session
 * - /api/auth/callback/*
 * - etc.
 */
export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }) => {
				return auth.handler(request)
			},
			POST: ({ request }) => {
				return auth.handler(request)
			},
		},
	},
})
