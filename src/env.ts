import { Schema } from "effect";

/**
 * Environment variable schema definitions
 */
const EnvSchema = Schema.Struct({
	// Server-side environment variables
	SERVER_URL: Schema.optional(Schema.String.pipe(Schema.startsWith("http"))),
	DATABASE_URL: Schema.String.pipe(
		Schema.nonEmptyString(),
		Schema.startsWith("postgresql://"),
	),
	DATABASE_POOL_MIN: Schema.optional(Schema.Number.pipe(Schema.int())),
	DATABASE_POOL_MAX: Schema.optional(Schema.Number.pipe(Schema.int())),

	// Client-side environment variables (must have VITE_ prefix)
	VITE_APP_TITLE: Schema.optional(Schema.String.pipe(Schema.nonEmptyString())),
});

type Env = typeof EnvSchema.Type;

/**
 * Parse and validate environment variables at runtime
 */
function createEnv(): Env {
	// Always use process.env - TanStack Start automatically loads .env files
	const envSource = process.env

	// Transform empty strings to undefined for proper handling
	const processedEnv = Object.fromEntries(
		Object.entries(envSource).map(([key, value]) => [
			key,
			value === "" ? undefined : value,
		]),
	)

	// Parse with Effect Schema (decodeUnknownSync throws on error)
	return Schema.decodeUnknownSync(EnvSchema)(processedEnv)
}

export const env = createEnv()
