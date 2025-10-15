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
 *   > const Products = await import('./src/domains/products.js')
 *   > await Products.GadgetBot.create({
 *       name: "CleanBot 3000",
 *       type: "cleaning",
 *       description: "Advanced cleaning robot",
 *       batteryLife: 8,
 *       maxLoadCapacity: 50,
 *       features: ["vacuum", "mop", "dust"]
 *     })
 *   > await Products.GadgetBot.findAll()
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
console.log("Welcome to the GadgetBot REPL!")
console.log("")
console.log("Quick start:")
console.log("  const Products = await import('./src/domains/products.js')")
console.log("")
console.log("Create a GadgetBot:")
console.log("  await Products.GadgetBot.create({")
console.log('    name: "CleanBot 3000",')
console.log('    type: "cleaning",')
console.log('    description: "Advanced cleaning robot",')
console.log("    batteryLife: 8,")
console.log("    maxLoadCapacity: 50,")
console.log('    features: ["vacuum", "mop", "dust"]')
console.log("  })")
console.log("")
console.log("List all GadgetBots:")
console.log("  await Products.GadgetBot.findAll()")
console.log("")
console.log("Find by ID:")
console.log('  await Products.GadgetBot.findById("id-here")')
console.log("")
console.log("Update:")
console.log('  await Products.GadgetBot.update("id-here", { name: "NewName" })')
console.log("")
console.log("Delete:")
console.log('  await Products.GadgetBot.deleteById("id-here")')
console.log("")
console.log("==================")
console.log("")

const replServer = repl.start({
	prompt: "> ",
	useColors: true,
})

// Set the working directory context
replServer.context.projectRoot = projectRoot

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
