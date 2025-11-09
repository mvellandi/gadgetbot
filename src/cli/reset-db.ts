import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"
import { sql } from "drizzle-orm"
import { exec } from "node:child_process"
import { promisify } from "node:util"

const execAsync = promisify(exec)

// Load environment variables
config()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
	console.error("❌ DATABASE_URL environment variable is not set")
	process.exit(1)
}

/**
 * Reset database: drop all tables, run migrations, and seed
 */
async function resetDatabase() {
	console.log("🔄 Resetting database...\n")

	const connection = postgres(DATABASE_URL!, { max: 1 })
	const db = drizzle(connection)

	try {
		// Drop all schemas (public and drizzle migration tracking)
		console.log("🗑️  Dropping all schemas...")
		await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`)
		await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`)
		await db.execute(sql`CREATE SCHEMA public`)
		console.log("✅ Schemas dropped and recreated\n")

		// Close connection for migrations
		await connection.end()

		// Run migrations
		console.log("🔄 Running migrations...")
		const migrationConnection = postgres(DATABASE_URL!, { max: 1 })
		const migrationDb = drizzle(migrationConnection)
		await migrate(migrationDb, { migrationsFolder: "./src/db/migrations" })
		await migrationConnection.end()
		console.log("✅ Migrations completed\n")

		// Run seed
		console.log("🌱 Seeding database...")
		await execAsync("npm run db:seed")

		console.log("\n✅ Database reset complete!")
	} catch (error) {
		console.error("❌ Reset failed:", error)
		process.exit(1)
	}
}

resetDatabase()
