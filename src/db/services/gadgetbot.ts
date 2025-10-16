import { Effect, Data } from "effect"
import { eq } from "drizzle-orm"
import { db } from "../client"
import { gadgetbots, type GadgetBotRow, type NewGadgetBotRow } from "../schema"

/**
 * GadgetBot Database Service
 *
 * Effect-based database operations for GadgetBots.
 * Uses tagged errors for structured error handling.
 */

// Error types
export class NotFoundError extends Data.TaggedError("NotFound")<{
	id: string
}> {}

export class DatabaseError extends Data.TaggedError("Database")<{
	cause: unknown
	operation: string
}> {}

export class ValidationError extends Data.TaggedError("Validation")<{
	message: string
}> {}

/**
 * Create a new GadgetBot
 */
export const createGadgetBot = (
	input: Omit<NewGadgetBotRow, "id" | "status" | "createdAt" | "updatedAt">,
): Effect.Effect<GadgetBotRow, DatabaseError> => {
	return Effect.tryPromise({
		try: async () => {
			const [result] = await db
				.insert(gadgetbots)
				.values({
					...input,
					status: "available",
				})
				.returning()
			return result!
		},
		catch: (error) =>
			new DatabaseError({ cause: error, operation: "createGadgetBot" }),
	})
}

/**
 * Find a GadgetBot by ID
 */
export const findGadgetBotById = (
	id: string,
): Effect.Effect<GadgetBotRow, NotFoundError | DatabaseError> => {
	return Effect.gen(function* () {
		const result = yield* Effect.tryPromise({
			try: () =>
				db.query.gadgetbots.findFirst({
					where: eq(gadgetbots.id, id),
				}),
			catch: (error) =>
				new DatabaseError({ cause: error, operation: "findGadgetBotById" }),
		})

		if (!result) {
			return yield* Effect.fail(new NotFoundError({ id }))
		}

		return result
	})
}

/**
 * Find all GadgetBots
 */
export const findAllGadgetBots = (): Effect.Effect<
	GadgetBotRow[],
	DatabaseError
> => {
	return Effect.tryPromise({
		try: () => db.query.gadgetbots.findMany(),
		catch: (error) =>
			new DatabaseError({ cause: error, operation: "findAllGadgetBots" }),
	})
}

/**
 * Update a GadgetBot
 */
export const updateGadgetBot = (
	id: string,
	input: Partial<Omit<NewGadgetBotRow, "id" | "createdAt" | "updatedAt">>,
): Effect.Effect<GadgetBotRow, NotFoundError | DatabaseError> => {
	return Effect.gen(function* () {
		const [result] = yield* Effect.tryPromise({
			try: () =>
				db
					.update(gadgetbots)
					.set({
						...input,
						updatedAt: new Date(),
					})
					.where(eq(gadgetbots.id, id))
					.returning(),
			catch: (error) =>
				new DatabaseError({ cause: error, operation: "updateGadgetBot" }),
		})

		if (!result) {
			return yield* Effect.fail(new NotFoundError({ id }))
		}

		return result
	})
}

/**
 * Delete a GadgetBot by ID
 * Returns the deleted row for confirmation and potential undo operations
 */
export const deleteGadgetBot = (
	id: string,
): Effect.Effect<GadgetBotRow, NotFoundError | DatabaseError> => {
	return Effect.gen(function* () {
		const [result] = yield* Effect.tryPromise({
			try: () =>
				db.delete(gadgetbots).where(eq(gadgetbots.id, id)).returning(),
			catch: (error) =>
				new DatabaseError({ cause: error, operation: "deleteGadgetBot" }),
		})

		if (!result) {
			return yield* Effect.fail(new NotFoundError({ id }))
		}

		return result
	})
}
