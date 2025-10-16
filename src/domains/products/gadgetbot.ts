import { Schema as S } from "effect"

/**
 * GadgetBot Resource
 *
 * Represents a robotic helper that homeowners can rent for various tasks.
 * Inspired by the gadgetbots from Ratchet & Clank.
 */

// Type-specific defaults for description and features
export const TYPE_DEFAULTS = {
	cleaning: {
		description: "Advanced cleaning robot for home maintenance",
		features: ["vacuuming", "mopping", "dusting", "window cleaning"],
	},
	gardening: {
		description: "Autonomous gardening assistant for lawn and plant care",
		features: ["mowing", "trimming", "watering", "weeding"],
	},
	security: {
		description: "Intelligent security robot for home monitoring",
		features: ["patrol", "motion detection", "alarm system", "video recording"],
	},
} as const

/**
 * GadgetBot resource operations
 */
export const GadgetBot = {
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
	 * Future: Will validate and persist to database
	 */
	create: async (_input: CreateGadgetBotInput): Promise<GadgetBotItem> => {
		// TODO: Validate input
		// TODO: Persist to database
		throw new Error("Not implemented: Database layer not yet available")
	},
}

// Enums for GadgetBot properties
export const GadgetBotType = S.Literal("cleaning", "gardening", "security")

export const GadgetBotStatus = S.Literal(
	"available",
	"rented",
	"maintenance",
	"retired",
)

// Main GadgetBot S
export const GadgetBotItem = S.Struct({
	id: S.String,
	name: S.String,
	type: GadgetBotType,
	status: GadgetBotStatus,
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

// Type inference
export type GadgetBotItem = typeof GadgetBotItem.Type

// CREATE
// Input schemas derived from main schema (like Ecto changesets)
// For creating: omit server-generated fields
export const CreateGadgetBotInput = S.Struct(GadgetBotItem.fields).pipe(
	S.omit("id", "status", "createdAt", "updatedAt"),
)

export type CreateGadgetBotInput = typeof CreateGadgetBotInput.Type

// UPDATE
// For updating: require id, make user-editable fields optional
const updateableFields = S.Struct(GadgetBotItem.fields).pipe(
	S.omit("id", "description", "features", "maxLoadCapacity", "createdAt", "updatedAt"),
)

export const UpdateGadgetBotInput = S.Struct({
	id: S.String,
}).pipe(S.extend(S.partial(updateableFields)))

export type UpdateGadgetBotInput = typeof UpdateGadgetBotInput.Type
