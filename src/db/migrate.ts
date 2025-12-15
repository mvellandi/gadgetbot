import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

// Load environment variables from .env file
config()

/**
 * Run database migrations
 * This script applies pending migrations to the database
 */

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
	console.error("❌ DATABASE_URL environment variable is not set")
	process.exit(1)
}

async function runMigrations() {
	console.log("🔄 Starting database migration...")

	// Create connection for migrations (DATABASE_URL is guaranteed to exist by the check above)
	const connection = postgres(DATABASE_URL!, { max: 1 })
	const db = drizzle(connection)

	try {
		await migrate(db, { migrationsFolder: "./src/db/migrations" })
		console.log("✅ Migrations completed successfully")
	} catch (error) {
		console.error("❌ Migration failed:", error)
		process.exit(1)
	} finally {
		await connection.end()
	}
}

runMigrations()
