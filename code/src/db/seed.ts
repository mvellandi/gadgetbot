import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Load environment variables from .env file (local dev only)
// In production (Coolify), env vars are already set in process.env
config()

/**
 * Seed database with sample GadgetBot data
 *
 * This is a standalone script that:
 * - Reads DATABASE_URL directly from process.env (no env.ts import)
 * - Creates its own database connection inline
 * - Works in both local development and production (Coolify containers)
 *
 * Why standalone: In production, src/env.ts is bundled into .output/ and not
 * available as a separate file that tsx can import during seeding.
 */

// Create standalone database connection
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
	throw new Error("DATABASE_URL environment variable is not set")
}

const connection = postgres(connectionString, {
	max: Number(process.env.DATABASE_POOL_MAX) || 10,
	idle_timeout: 20,
	connect_timeout: 10,
})

const db = drizzle(connection, { schema })

const sampleGadgetBots = [
	{
		name: "CleanBot 3000",
		type: "cleaning" as const,
		description: "Advanced cleaning robot for home maintenance",
		batteryLife: 8.0,
		maxLoadCapacity: 10.0,
		features: ["vacuuming", "mopping", "dusting", "window cleaning"],
	},
	{
		name: "GardenMaster Pro",
		type: "gardening" as const,
		description: "Autonomous gardening assistant for lawn and plant care",
		batteryLife: 12.0,
		maxLoadCapacity: 25.0,
		features: ["mowing", "trimming", "watering", "weeding"],
	},
	{
		name: "SecureGuard X1",
		type: "security" as const,
		description: "Intelligent security robot for home monitoring",
		batteryLife: 24.0,
		maxLoadCapacity: 5.0,
		features: ["patrol", "motion detection", "alarm system", "video recording"],
	},
	{
		name: "VacBot Ultra",
		type: "cleaning" as const,
		description: "Premium vacuum robot with AI-powered navigation",
		batteryLife: 6.0,
		maxLoadCapacity: 8.0,
		features: ["vacuuming", "mopping", "carpet detection", "self-emptying"],
	},
	{
		name: "LawnKeeper 2000",
		type: "gardening" as const,
		description: "Automated lawn maintenance specialist",
		batteryLife: 10.0,
		maxLoadCapacity: 20.0,
		features: ["mowing", "edging", "fertilizing", "leaf blowing"],
	},
]

async function seed() {
	console.log("🌱 Starting database seed...\n")

	try {
		// Check existing data
		const existing = await db.query.gadgetbots.findMany()
		if (existing.length > 0) {
			console.log(
				`⚠️  Database already contains ${existing.length} GadgetBot(s)`,
			)
			console.log("Skipping seed. Run db:reset to clear and re-seed.\n")
			return
		}

		// Create sample GadgetBots using direct Drizzle insert
		for (const bot of sampleGadgetBots) {
			const [created] = await db
				.insert(schema.gadgetbots)
				.values({
					...bot,
					status: "available",
				})
				.returning()
			console.log(`✅ Created: ${created!.name} (${created!.type})`)
		}

		console.log(`\n🎉 Successfully seeded ${sampleGadgetBots.length} GadgetBots!`)
	} catch (error) {
		console.error("❌ Seed failed:", error)
		process.exit(1)
	} finally {
		// Close database connection and exit
		await connection.end()
		process.exit(0)
	}
}

seed()
