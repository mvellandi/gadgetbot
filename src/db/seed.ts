import { GadgetBot } from "@/domains/products/gadgetbot"

/**
 * Seed database with sample GadgetBot data
 * Environment variables are loaded from process.env (works in both local and production)
 */

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
		const existing = await GadgetBot.findAll()
		if (existing.length > 0) {
			console.log(
				`⚠️  Database already contains ${existing.length} GadgetBot(s)`,
			)
			console.log("Skipping seed. Run db:reset to clear and re-seed.\n")
			return
		}

		// Create sample GadgetBots
		for (const bot of sampleGadgetBots) {
			const created = await GadgetBot.create(bot)
			console.log(`✅ Created: ${created.name} (${created.type})`)
		}

		console.log(`\n🎉 Successfully seeded ${sampleGadgetBots.length} GadgetBots!`)
	} catch (error) {
		console.error("❌ Seed failed:", error)
		process.exit(1)
	}
}

seed()
