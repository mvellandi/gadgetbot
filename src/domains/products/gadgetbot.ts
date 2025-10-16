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

// Bot Specifications - Each type has fixed specs (like product models/SKUs)
// These define the immutable characteristics of each bot type
const BOT_SPECS = {
	cleaning: {
		type: "cleaning" as const,
		description:
			"Advanced cleaning robot with multi-surface detection and adaptive cleaning modes. Perfect for maintaining spotless homes with minimal effort.",
		batteryLife: 8,
		maxLoadCapacity: 15,
		features: [
			"Multi-surface cleaning",
			"Auto-recharge capability",
			"Spot cleaning mode",
			"Edge detection sensors",
			"HEPA filtration system",
		],
		imageUrl: null,
	},
	gardening: {
		type: "gardening" as const,
		description:
			"Autonomous gardening assistant for lawn maintenance and basic landscaping tasks. Weather-resistant design for year-round outdoor use.",
		batteryLife: 12,
		maxLoadCapacity: 25,
		features: [
			"Precision mowing patterns",
			"Weed detection and removal",
			"Weather-resistant housing",
			"Terrain mapping",
			"Solar charging support",
		],
		imageUrl: null,
	},
	security: {
		type: "security" as const,
		description:
			"Intelligent security patrol unit with advanced threat detection capabilities. Provides 24/7 monitoring and immediate alert notifications.",
		batteryLife: 24,
		maxLoadCapacity: 10,
		features: [
			"24/7 autonomous patrol mode",
			"Motion detection sensors",
			"Facial recognition AI",
			"Real-time alert system",
			"Night vision cameras",
			"Emergency response protocol",
		],
		imageUrl: null,
	},
} as const

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

// User input schemas - only fields user can provide
const CreateInputSchema = S.Struct({
	name: S.String.pipe(S.nonEmptyString()),
	type: GadgetBotTypeSchema,
})

const UpdateInputSchema = S.Struct({
	batteryLife: S.optional(S.Number.pipe(S.greaterThan(0))),
})

// Type definitions
type GadgetBotItem = typeof GadgetBotItemSchema.Type
type GadgetBotType = typeof GadgetBotTypeSchema.Type
type GadgetBotStatus = typeof GadgetBotStatusSchema.Type
type CreateInput = typeof CreateInputSchema.Type
type UpdateInput = typeof UpdateInputSchema.Type
type BotSpec = typeof BOT_SPECS.cleaning

/**
 * Convert database row to domain model
 * Handles null -> undefined conversion for optional fields
 */
function rowToModel(row: GadgetBotRow): GadgetBotItem {
	return {
		id: row.id,
		name: row.name,
		type: row.type as GadgetBotType,
		status: row.status as GadgetBotStatus,
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
	CreateInput: CreateInputSchema,
	UpdateInput: UpdateInputSchema,
	Type: GadgetBotTypeSchema,
	Status: GadgetBotStatusSchema,
} as const

// Types interface for consumers
type Types = {
	Item: GadgetBotItem
	CreateInput: CreateInput
	UpdateInput: UpdateInput
	BotSpec: BotSpec
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
	 * Returns a new GadgetBot input template and all bot specs
	 * Template has no type selected - user must choose
	 * Specs contain fixed specifications for each bot type
	 */
	new: () => {
		return {
			template: {
				name: "",
				type: undefined as GadgetBotType | undefined,
			},
			specs: BOT_SPECS,
		}
	},

	/**
	 * Creates a new GadgetBot
	 * Merges user input with bot specs and persists to database
	 */
	create: async (input: CreateInput): Promise<GadgetBotItem> => {
		// Validate user input with CreateInputSchema
		const validated = S.decodeUnknownSync(CreateInputSchema)(input)

		// Get specs for the selected type
		const spec = BOT_SPECS[validated.type]

		// Create in database with merged data
		const effect = Effect.gen(function* () {
			const result = yield* GadgetBotService.createGadgetBot({
				name: validated.name,
				type: spec.type,
				description: spec.description,
				batteryLife: spec.batteryLife,
				maxLoadCapacity: spec.maxLoadCapacity,
				features: [...spec.features],
				imageUrl: spec.imageUrl,
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
	 * Allows updating batteryLife to reflect actual condition
	 * All other fields (name, type, description, features, etc.) are immutable
	 */
	update: async (id: string, input: UpdateInput): Promise<GadgetBotItem> => {
		// Validate update input
		const validated = S.decodeUnknownSync(UpdateInputSchema)(input)

		// Build update object, only including defined fields
		const updateData: Partial<{ batteryLife: number }> = {}
		if (validated.batteryLife !== undefined) {
			updateData.batteryLife = validated.batteryLife
		}

		const effect = GadgetBotService.updateGadgetBot(id, updateData).pipe(
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
	 * Bot specifications - fixed characteristics for each bot type
	 * Used by forms and create operations to populate type-specific fields
	 */
	Specs: BOT_SPECS,

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
