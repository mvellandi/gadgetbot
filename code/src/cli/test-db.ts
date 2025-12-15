import { GadgetBot } from "@/domains/products/gadgetbot"

/**
 * Quick test script to verify database operations
 */

async function test() {
	console.log("🧪 Testing GadgetBot database operations...\n")

	try {
		// Find all GadgetBots
		console.log("📋 Fetching all GadgetBots...")
		const all = await GadgetBot.findAll()
		console.log(`Found ${all.length} GadgetBots:\n`)

		for (const bot of all) {
			console.log(`- ${bot.name} (${bot.type}) - ${bot.status}`)
			console.log(`  Battery: ${bot.batteryLife}h | Load: ${bot.maxLoadCapacity}kg`)
			console.log(`  Features: ${bot.features.join(", ")}`)
			console.log("")
		}

		if (all.length > 0) {
			// Test findById
			const first = all[0]!
			console.log(`🔍 Testing findById with "${first.name}"...`)
			const found = await GadgetBot.findById(first.id)
			console.log(`✅ Found: ${found.name}\n`)

			// Test update (only batteryLife is editable)
			console.log(`📝 Testing update for "${first.name}"...`)
			const originalBattery = first.batteryLife
			const updated = await GadgetBot.update(first.id, {
				batteryLife: originalBattery - 1,
			})
			console.log(`✅ Updated batteryLife: ${originalBattery}h → ${updated.batteryLife}h\n`)

			// Revert the update
			await GadgetBot.update(first.id, {
				batteryLife: originalBattery,
			})

			// Test create and delete (specs are now auto-merged from type)
			console.log("➕ Testing create operation...")
			const newBot = await GadgetBot.create({
				name: "TestBot 9000",
				type: "cleaning",
			})
			console.log(`✅ Created: ${newBot.name} (ID: ${newBot.id})`)
			console.log(`   Type: ${newBot.type} | Specs auto-applied: ${newBot.description}\n`)

			// Test delete
			console.log(`🗑️  Testing delete for "${newBot.name}"...`)
			const deleted = await GadgetBot.deleteById(newBot.id)
			console.log(`✅ Deleted: ${deleted.name} (${deleted.type})`)
			console.log(`   Confirmation: Received deleted item with ID ${deleted.id}\n`)
		}

		console.log("✅ All tests passed!")
	} catch (error) {
		console.error("❌ Test failed:", error)
		process.exit(1)
	}
}

test()
