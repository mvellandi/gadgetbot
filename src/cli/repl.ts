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
 */

// import repl from "node:repl"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
// import { Effect, Layer, Logger, LogLevel, ManagedRuntime } from "effect"
// import { GadgetBotService } from "../domains/products/gadgetbot-service.js"
// import type { CreateGadgetBotInput, GadgetBot as GadgetBotType, UpdateGadgetBotInput } from "../domains/products/gadgetbot.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, "../..")

console.log("🤖 GadgetBot REPL")
console.log("==================")
console.log("")
console.log("Loading domain modules...")