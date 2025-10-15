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
import { Effect, Layer, Logger, LogLevel, ManagedRuntime } from "effect"
import { GadgetBotService } from "../domains/products/gadgetbot-service.js"
import type { CreateGadgetBotInput, GadgetBot as GadgetBotType, UpdateGadgetBotInput } from "../domains/products/gadgetbot.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, "../..")

console.log("🤖 GadgetBot REPL")
console.log("==================")
console.log("")
console.log("Loading domain modules...")

// Create a custom runtime with logging disabled for cleaner REPL experience
const SilentGadgetBotRuntime = ManagedRuntime.make(
	Layer.merge(
		Logger.minimumLogLevel(LogLevel.None),
		GadgetBotService.Default
	),
)

// Create silent wrapper functions for cleaner REPL output
const GadgetBot = {
	create: async (input: CreateGadgetBotInput): Promise<GadgetBotType> => {
		return SilentGadgetBotRuntime.runPromise(
			Effect.gen(function* () {
				const service = yield* GadgetBotService
				return yield* service.create(input)
			}),
		)
	},

	findAll: async (): Promise<GadgetBotType[]> => {
		return SilentGadgetBotRuntime.runPromise(
			Effect.gen(function* () {
				const service = yield* GadgetBotService
				return yield* service.findAll()
			}),
		)
	},

	findById: async (id: string): Promise<GadgetBotType> => {
		return SilentGadgetBotRuntime.runPromise(
			Effect.gen(function* () {
				const service = yield* GadgetBotService
				return yield* service.findById(id)
			}),
		)
	},

	update: async (id: string, input: Partial<Omit<UpdateGadgetBotInput, "id">>): Promise<GadgetBotType> => {
		return SilentGadgetBotRuntime.runPromise(
			Effect.gen(function* () {
				const service = yield* GadgetBotService
				return yield* service.update(id, input)
			}),
		)
	},

	deleteById: async (id: string): Promise<void> => {
		return SilentGadgetBotRuntime.runPromise(
			Effect.gen(function* () {
				const service = yield* GadgetBotService
				return yield* service.deleteById(id)
			}),
		)
	},
}

// Also load the full Products module for reference
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
replServer.context.GadgetBot = GadgetBot // Use silent version
replServer.context.Products = Products // Full module with logging

// Handle cleanup on exit
replServer.on("exit", async () => {
	console.log("\nGoodbye! 👋")

	// Dispose both runtimes
	try {
		await SilentGadgetBotRuntime.dispose()
		const { GadgetBotRuntime } = await import("../domains/products/gadgetbot-runtime.js")
		await GadgetBotRuntime.dispose()
	} catch (error) {
		// Ignore errors during cleanup
	}

	process.exit(0)
})
