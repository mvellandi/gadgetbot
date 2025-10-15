/**
 * Node REPL for testing domain operations
 *
 * Inspired by Elixir's `iex -S mix`, this REPL allows interactive testing
 * of domain operations without writing implementation code.
 *
 * Usage:
 *   npm run repl
 *
 * Example session:
 *   > await GadgetBot.create({
 *       name: "CleanBot 3000",
 *       type: "cleaning",
 *       description: "Advanced cleaning robot",
 *       batteryLife: 8,
 *       maxLoadCapacity: 50,
 *       features: ["vacuum", "mop", "dust"]
 *     })
 *   > await GadgetBot.findAll()
 */

import repl from "node:repl"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, "../..")

console.log("🤖 GadgetBot REPL")
console.log("==================")
console.log("")
console.log("Loading domain modules...")

// Pre-load domain modules
const Products = await import("../domains/products.js")

console.log("✓ Loaded: GadgetBot")
console.log("")
console.log("Available APIs:")
console.log("  - GadgetBot.create(input)")
console.log("  - GadgetBot.findAll()")
console.log("  - GadgetBot.findById(id)")
console.log("  - GadgetBot.update(id, input)")
console.log("  - GadgetBot.deleteById(id)")
console.log("")
console.log("Quick start:")
console.log('  await GadgetBot.create({')
console.log('    name: "CleanBot 3000",')
console.log('    type: "cleaning",')
console.log('    description: "Advanced cleaning robot",')
console.log("    batteryLife: 8,")
console.log("    maxLoadCapacity: 50,")
console.log('    features: ["vacuum", "mop", "dust"]')
console.log("  })")
console.log("")
console.log("  await GadgetBot.findAll()")
console.log("")
console.log("==================")
console.log("")

const replServer = repl.start({
	prompt: "> ",
	useColors: true,
})

// Pre-load domain APIs into context
replServer.context.projectRoot = projectRoot
replServer.context.GadgetBot = Products.GadgetBot
replServer.context.Products = Products

// Handle cleanup on exit
replServer.on("exit", async () => {
	console.log("\nGoodbye! 👋")

	// Dispose the runtime
	try {
		const { GadgetBotRuntime } = await import("../domains/products/gadgetbot-runtime.js")
		await GadgetBotRuntime.dispose()
	} catch (error) {
		// Ignore errors during cleanup
	}

	process.exit(0)
})
