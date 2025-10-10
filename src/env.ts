import { Schema } from "effect";

/**
 * Environment variable schema definitions
 */
const EnvSchema = Schema.Struct({
	// Server-side environment variables
	SERVER_URL: Schema.optional(Schema.String.pipe(Schema.startsWith("http"))),

	// Client-side environment variables (must have VITE_ prefix)
	VITE_APP_TITLE: Schema.optional(Schema.String.pipe(Schema.nonEmptyString())),
});

type Env = typeof EnvSchema.Type;

/**
 * Parse and validate environment variables at runtime
 */
function createEnv(runtimeEnv: Record<string, unknown>): Env {
	// Transform empty strings to undefined for proper handling
	const processedEnv = Object.fromEntries(
		Object.entries(runtimeEnv).map(([key, value]) => [
			key,
			value === "" ? undefined : value,
		]),
	);

	// Parse with Effect Schema (decodeUnknownSync throws on error)
	return Schema.decodeUnknownSync(EnvSchema)(processedEnv);
}

export const env = createEnv(import.meta.env);
