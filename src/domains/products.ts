/**
 * Products Domain API
 *
 * Domain module for product-related resources in the GadgetBot rental service.
 * Following Elixir Ash DDD patterns.
 *
 * This module exports clean async functions that hide Effect implementation details.
 * All functions return Promises and throw standard Error classes on failure.
 */

import { Effect } from "effect"
import type { CreateGadgetBotInput, GadgetBot as GadgetBotType, UpdateGadgetBotInput } from "./products/gadgetbot"
import { GadgetBotService } from "./products/gadgetbot-service"
import { GadgetBotRuntime } from "./products/gadgetbot-runtime"

export * from "./products/gadgetbot"

/**
 * GadgetBot Domain API
 *
 * Clean async functions for managing GadgetBot entities.
 * Uses ManagedRuntime internally but exposes only Promises.
 */
export const GadgetBot = {
	/**
	 * Create a new GadgetBot
	 */
	create: async (input: CreateGadgetBotInput): Promise<GadgetBotType> => {
		return GadgetBotRuntime.runPromise(
			Effect.gen(function* () {
				const service = yield* GadgetBotService
				return yield* service.create(input)
			}),
		)
	},

	/**
	 * Find all GadgetBots
	 */
	findAll: async (): Promise<GadgetBotType[]> => {
		return GadgetBotRuntime.runPromise(
			Effect.gen(function* () {
				const service = yield* GadgetBotService
				return yield* service.findAll()
			}),
		)
	},

	/**
	 * Find a GadgetBot by ID
	 */
	findById: async (id: string): Promise<GadgetBotType> => {
		return GadgetBotRuntime.runPromise(
			Effect.gen(function* () {
				const service = yield* GadgetBotService
				return yield* service.findById(id)
			}),
		)
	},

	/**
	 * Update a GadgetBot
	 */
	update: async (id: string, input: Partial<Omit<UpdateGadgetBotInput, "id">>): Promise<GadgetBotType> => {
		return GadgetBotRuntime.runPromise(
			Effect.gen(function* () {
				const service = yield* GadgetBotService
				return yield* service.update(id, input)
			}),
		)
	},

	/**
	 * Delete a GadgetBot by ID
	 */
	deleteById: async (id: string): Promise<void> => {
		return GadgetBotRuntime.runPromise(
			Effect.gen(function* () {
				const service = yield* GadgetBotService
				return yield* service.deleteById(id)
			}),
		)
	},
}
