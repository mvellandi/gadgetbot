/**
 * Test the Products Domain API
 * Usage: npm run test:domain
 */

import { Products } from "@/domains/products"

async function testDomainAPI() {
	console.log("🧪 Testing Products Domain API\n")

	try {
		// Test 1: Get template
		console.log("1️⃣  Testing Products.GadgetBot.new()...")
		const template = Products.GadgetBot.new()
		console.log("   ✅ Template:", template)

		// Test 2: List all
		console.log("\n2️⃣  Testing Products.GadgetBot.findAll()...")
		const allBots = await Products.GadgetBot.findAll()
		console.log(`   ✅ Found ${allBots.length} gadgetbots`)
		if (allBots.length > 0) {
			console.log("   First bot:", {
				id: allBots[0].id,
				name: allBots[0].name,
				type: allBots[0].type,
			})
		}

		// Test 3: Find by ID
		if (allBots.length > 0) {
			const testId = allBots[0].id
			console.log(`\n3️⃣  Testing Products.GadgetBot.findById('${testId}')...`)
			const bot = await Products.GadgetBot.findById(testId)
			console.log("   ✅ Found:", bot.name)
		}

		// Test 4: Create (specs are auto-merged from type)
		console.log("\n4️⃣  Testing Products.GadgetBot.create()...")
		const newBot = await Products.GadgetBot.create({
			name: "TestBot 3000",
			type: "cleaning",
		})
		console.log("   ✅ Created:", {
			id: newBot.id,
			name: newBot.name,
			type: newBot.type,
			description: newBot.description,
		})

		// Test 5: Update (only batteryLife is editable)
		console.log(`\n5️⃣  Testing Products.GadgetBot.update('${newBot.id}')...`)
		const updated = await Products.GadgetBot.update(newBot.id, {
			batteryLife: 6.5,
		})
		console.log("   ✅ Updated:", {
			batteryLife: updated.batteryLife,
		})

		// Test 6: Delete
		console.log(`\n6️⃣  Testing Products.GadgetBot.deleteById('${newBot.id}')...`)
		const deleted = await Products.GadgetBot.deleteById(newBot.id)
		console.log("   ✅ Deleted:", deleted.name)

		// Test 7: Verify deletion
		console.log(`\n7️⃣  Verifying deletion...`)
		try {
			await Products.GadgetBot.findById(newBot.id)
			console.log("   ❌ ERROR: Bot still exists after deletion!")
		} catch (error) {
			console.log("   ✅ Confirmed: Bot not found (expected)")
		}

		console.log("\n✅ All tests passed!")
	} catch (error) {
		console.error("\n❌ Test failed:", error)
		process.exit(1)
	}
}

testDomainAPI()
