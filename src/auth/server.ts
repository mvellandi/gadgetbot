import { betterAuth } from "better-auth"
import { genericOAuth } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db/client"
import { env } from "@/env"
import * as schema from "@/db/schema/auth"

/**
 * Better Auth server configuration
 *
 * Integrates with:
 * - Zitadel (OAuth/OIDC provider via genericOAuth plugin)
 * - PostgreSQL (via Drizzle adapter)
 * - HTTP-only cookie sessions
 */
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
		},
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	plugins: [
		// Configure Zitadel as a generic OAuth provider
		// Using PKCE (no client secret required for public clients)
		...(env.ZITADEL_CLIENT_ID && env.ZITADEL_ISSUER_URL
			? [
					genericOAuth({
						config: [
							{
								providerId: "zitadel",
								discoveryUrl: `${env.ZITADEL_ISSUER_URL}/.well-known/openid-configuration`,
								clientId: env.ZITADEL_CLIENT_ID,
								// No clientSecret needed - PKCE is used for public clients
								clientSecret: env.ZITADEL_CLIENT_SECRET || "",
								scopes: ["openid", "profile", "email", "offline_access"],
								pkce: true, // PKCE eliminates need for client secret
							},
						],
					}),
				]
			: []),
	],
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes
		},
	},
	advanced: {
		// Use secure cookies in production (HTTPS)
		useSecureCookies: env.BETTER_AUTH_URL.startsWith("https"),
	},
})

export type Auth = typeof auth
export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
