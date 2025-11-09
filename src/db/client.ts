import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { env } from "@/env"
import * as schema from "./schema"

/**
 * PostgreSQL connection with pooling
 * Uses environment variables for configuration
 */
const connectionString = env.DATABASE_URL

if (!connectionString) {
	throw new Error("DATABASE_URL environment variable is not set")
}

// Create postgres connection
export const connection = postgres(connectionString, {
	max: env.DATABASE_POOL_MAX || 10,
	idle_timeout: 20,
	connect_timeout: 10,
})

// Create Drizzle instance with schema for query builder
export const db = drizzle(connection, { schema })
