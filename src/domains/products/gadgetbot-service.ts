/**
 * GadgetBot Service
 *
 * Effect service that provides CRUD operations for GadgetBot entities.
 * Uses an in-memory store for now (will be replaced with database later).
 */

import { DateTime, Effect, Schema } from "effect"
import type { GadgetBot } from "./gadgetbot"
import { CreateGadgetBotInput as CreateGadgetBotInputSchema, UpdateGadgetBotInput as UpdateGadgetBotInputSchema } from "./gadgetbot"
import type { CreateGadgetBotInput, UpdateGadgetBotInput } from "./gadgetbot"

// Tagged Errors for the service
export class NotFoundError extends Schema.TaggedError<NotFoundError>()("NotFound", {
	id: Schema.String,
	message: Schema.String,
}) {}

export class ValidationError extends Schema.TaggedError<ValidationError>()("ValidationError", {
	message: Schema.String,
	cause: Schema.optional(Schema.Defect),
}) {}

// In-memory store (temporary - will be replaced with database)
const store = new Map<string, GadgetBot>()

/**
 * GadgetBot Service
 *
 * Provides CRUD operations for GadgetBot entities using Effect.
 */
export class GadgetBotService extends Effect.Service<GadgetBotService>()("GadgetBotService", {
	dependencies: [],

	scoped: Effect.gen(function* () {
		// CREATE - Create a new GadgetBot
		const create = Effect.fn("GadgetBotService.create")(function* (input: CreateGadgetBotInput) {
			yield* Effect.annotateCurrentSpan({ operation: "create" })

			// Validate input with Effect Schema
			const validatedInput = yield* Schema.decodeUnknown(CreateGadgetBotInputSchema)(input).pipe(
				Effect.mapError((parseError) =>
					new ValidationError({
						message: `Invalid GadgetBot input: ${parseError.message}`,
						cause: parseError,
					})
				)
			)

			// Generate ID and timestamps
			const id = crypto.randomUUID()
			const now = DateTime.unsafeNow()

			const gadgetBot: GadgetBot = {
				id,
				...validatedInput,
				status: "available",
				createdAt: now,
				updatedAt: now,
			}

			// Store in memory
			store.set(id, gadgetBot)

			yield* Effect.logInfo("Created GadgetBot", { id, name: gadgetBot.name })

			return gadgetBot
		})

		// READ ALL - Find all GadgetBots
		const findAll = Effect.fn("GadgetBotService.findAll")(function* () {
			yield* Effect.annotateCurrentSpan({ operation: "findAll" })

			const bots = Array.from(store.values())

			yield* Effect.logInfo("Retrieved all GadgetBots", { count: bots.length })

			return bots
		})

		// READ ONE - Find a GadgetBot by ID
		const findById = Effect.fn("GadgetBotService.findById")(function* (id: string) {
			yield* Effect.annotateCurrentSpan({ operation: "findById", id })

			const bot = store.get(id)

			if (!bot) {
				return yield* Effect.fail(
					new NotFoundError({
						id,
						message: `GadgetBot with id ${id} not found`,
					}),
				)
			}

			yield* Effect.logInfo("Retrieved GadgetBot", { id, name: bot.name })

			return bot
		})

		// UPDATE - Update a GadgetBot
		const update = Effect.fn("GadgetBotService.update")(function* (id: string, input: Partial<Omit<UpdateGadgetBotInput, "id">>) {
			yield* Effect.annotateCurrentSpan({ operation: "update", id })

			const existing = store.get(id)

			if (!existing) {
				return yield* Effect.fail(
					new NotFoundError({
						id,
						message: `GadgetBot with id ${id} not found`,
					}),
				)
			}

			// Validate partial update input with Effect Schema
			// We validate the full update object (id + partial fields)
			const validatedInput = yield* Schema.decodeUnknown(UpdateGadgetBotInputSchema)({ id, ...input }).pipe(
				Effect.mapError((parseError) =>
					new ValidationError({
						message: `Invalid update input: ${parseError.message}`,
						cause: parseError,
					})
				)
			)

			const updated: GadgetBot = {
				...existing,
				...validatedInput,
				id, // Ensure ID doesn't change
				updatedAt: DateTime.unsafeNow(),
			}

			store.set(id, updated)

			yield* Effect.logInfo("Updated GadgetBot", { id, name: updated.name })

			return updated
		})

		// DELETE - Delete a GadgetBot by ID
		const deleteById = Effect.fn("GadgetBotService.deleteById")(function* (id: string) {
			yield* Effect.annotateCurrentSpan({ operation: "delete", id })

			const existing = store.get(id)

			if (!existing) {
				return yield* Effect.fail(
					new NotFoundError({
						id,
						message: `GadgetBot with id ${id} not found`,
					}),
				)
			}

			store.delete(id)

			yield* Effect.logInfo("Deleted GadgetBot", { id })
		})

		return { create, findAll, findById, update, deleteById } as const
	}),
}) {}
