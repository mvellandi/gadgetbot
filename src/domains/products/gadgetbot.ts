import { Schema as S, Effect } from "effect"
import * as GadgetBotService from "@/db/services/gadgetbot"
import type { GadgetBotRow } from "@/db/schema"

/**
 * GadgetBot Resource
 *
 * Represents a robotic helper that homeowners can rent for various tasks.
 * Inspired by the gadgetbots from Ratchet & Clank.
 *
 * This module exports a single GadgetBot object containing:
 * - Operations: CRUD functions
 * - Schemas: Effect Schemas for API layer
 * - Types: TypeScript type definitions
 */

// Schemas - Effect Schema definitions

// Enums for GadgetBot properties
const GadgetBotTypeSchema = S.Literal("cleaning", "gardening", "security")

const GadgetBotStatusSchema = S.Literal(
	"available",
	"rented",
	"maintenance",
	"retired",
)

// Main GadgetBot schema
const GadgetBotItemSchema = S.Struct({
	id: S.String,
	name: S.String,
	type: GadgetBotTypeSchema,
	status: GadgetBotStatusSchema,
	description: S.String,

	// Capabilities
	batteryLife: S.Number.pipe(
		S.greaterThan(0),
		S.annotations({ description: "Battery life in hours" }),
	),
	maxLoadCapacity: S.Number.pipe(
		S.greaterThan(0),
		S.annotations({ description: "Maximum load capacity in kg" }),
	),
	features: S.Array(S.String),

	// Metadata
	imageUrl: S.optional(S.String),
	createdAt: S.DateTimeUtc,
	updatedAt: S.DateTimeUtc,
})

// CREATE - Input schema for creating: omit server-generated fields
const CreateGadgetBotInputSchema = S.Struct(GadgetBotItemSchema.fields).pipe(
	S.omit("id", "status", "createdAt", "updatedAt"),
)

// UPDATE - For updating: require id, make user-editable fields optional
const updateableFields = S.Struct(GadgetBotItemSchema.fields).pipe(
	S.omit(
		"id",
		"description",
		"features",
		"maxLoadCapacity",
		"createdAt",
		"updatedAt",
	),
)

const UpdateGadgetBotInputSchema = S.Struct({
	id: S.String,
}).pipe(S.extend(S.partial(updateableFields)))

// Type definitions
type GadgetBotItem = typeof GadgetBotItemSchema.Type
type CreateGadgetBotInput = typeof CreateGadgetBotInputSchema.Type
type UpdateGadgetBotInput = typeof UpdateGadgetBotInputSchema.Type

/**
 * Convert database row to domain model
 * Handles null -> undefined conversion for optional fields
 */
function rowToModel(row: GadgetBotRow): GadgetBotItem {
	return {
		id: row.id,
		name: row.name,
		type: row.type as "cleaning" | "gardening" | "security",
		status: row.status as "available" | "rented" | "maintenance" | "retired",
		description: row.description,
		batteryLife: row.batteryLife,
		maxLoadCapacity: row.maxLoadCapacity,
		features: [...row.features],
		imageUrl: row.imageUrl ?? undefined,
		createdAt: row.createdAt.toISOString() as any,
		updatedAt: row.updatedAt.toISOString() as any,
	}
}

// Schemas object for API layer
const Schemas = {
	Item: GadgetBotItemSchema,
	CreateInput: CreateGadgetBotInputSchema,
	UpdateInput: UpdateGadgetBotInputSchema,
	Type: GadgetBotTypeSchema,
	Status: GadgetBotStatusSchema,
} as const

// Types interface for consumers
type Types = {
	Item: GadgetBotItem
	CreateInput: CreateGadgetBotInput
	UpdateInput: UpdateGadgetBotInput
}

/**
 * GadgetBot resource operations, schemas, and types
 * Single export for the entire GadgetBot domain
 */
export const GadgetBot = {
	// ========================================
	// Operations
	// ========================================

	/**
	 * Returns a new GadgetBot input template with minimal defaults
	 * Type and other fields should be filled in by the user/form
	 */
	new: (): CreateGadgetBotInput => {
		return {
			name: "",
			type: "cleaning",
			description: "",
			batteryLife: 8.0,
			maxLoadCapacity: 10.0,
			features: [],
			imageUrl: undefined,
		}
	},

	/**
	 * Creates a new GadgetBot
	 * Validates input with Effect Schema and persists to database
	 */
	create: async (input: CreateGadgetBotInput): Promise<GadgetBotItem> => {
		// Validate input with Effect Schema
		const validated = S.decodeUnknownSync(CreateGadgetBotInputSchema)(input)

		// Create in database
		const effect = Effect.gen(function* () {
			const result = yield* GadgetBotService.createGadgetBot({
				name: validated.name,
				type: validated.type,
				description: validated.description,
				batteryLife: validated.batteryLife,
				maxLoadCapacity: validated.maxLoadCapacity,
				features: [...validated.features],
				imageUrl: validated.imageUrl ?? null,
			})

			return rowToModel(result)
		}).pipe(
			Effect.catchTag("Database", (error) =>
				Effect.fail(new Error(`Database error: ${error.operation}`)),
			),
		)

		return Effect.runPromise(effect)
	},

	/**
	 * Find a GadgetBot by ID
	 */
	findById: async (id: string): Promise<GadgetBotItem> => {
		const effect = GadgetBotService.findGadgetBotById(id).pipe(
			Effect.map(rowToModel),
			Effect.catchTag("NotFound", (error) =>
				Effect.fail(new Error(`GadgetBot ${error.id} not found`)),
			),
			Effect.catchTag("Database", (error) =>
				Effect.fail(new Error(`Database error: ${error.operation}`)),
			),
		)

		return Effect.runPromise(effect)
	},

	/**
	 * Find all GadgetBots
	 */
	findAll: async (): Promise<GadgetBotItem[]> => {
		const effect = GadgetBotService.findAllGadgetBots().pipe(
			Effect.map((rows) => rows.map(rowToModel)),
			Effect.catchTag("Database", (error) =>
				Effect.fail(new Error(`Database error: ${error.operation}`)),
			),
		)

		return Effect.runPromise(effect)
	},

	/**
	 * Update a GadgetBot
	 */
	update: async (
		id: string,
		input: Partial<Omit<CreateGadgetBotInput, "id" | "createdAt" | "updatedAt">>,
	): Promise<GadgetBotItem> => {
		const effect = GadgetBotService.updateGadgetBot(id, {
			...input,
			features: input.features ? [...input.features] : undefined,
			imageUrl: input.imageUrl ?? null,
		}).pipe(
			Effect.map(rowToModel),
			Effect.catchTag("NotFound", (error) =>
				Effect.fail(new Error(`GadgetBot ${error.id} not found`)),
			),
			Effect.catchTag("Database", (error) =>
				Effect.fail(new Error(`Database error: ${error.operation}`)),
			),
		)

		return Effect.runPromise(effect)
	},

	/**
	 * Delete a GadgetBot by ID
	 * Returns the deleted GadgetBot for confirmation
	 */
	deleteById: async (id: string): Promise<GadgetBotItem> => {
		const effect = GadgetBotService.deleteGadgetBot(id).pipe(
			Effect.map(rowToModel),
			Effect.catchTag("NotFound", (error) =>
				Effect.fail(new Error(`GadgetBot ${error.id} not found`)),
			),
			Effect.catchTag("Database", (error) =>
				Effect.fail(new Error(`Database error: ${error.operation}`)),
			),
		)

		return Effect.runPromise(effect)
	},

	// ========================================
	// Schemas and Types
	// ========================================

	/**
	 * Effect Schemas for use by oRPC, forms, etc.
	 * Maintains clean boundaries - API layer accesses through domain, not resources
	 */
	Schemas,

	/**
	 * TypeScript types for use by consumers
	 * Exported through domain API to maintain boundaries
	 */
	Types: {} as Types,
}
