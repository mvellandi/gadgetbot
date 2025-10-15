import { Schema as S } from "effect"

/**
 * GadgetBot Resource
 *
 * Represents a robotic helper that homeowners can rent for various tasks.
 * Inspired by the gadgetbots from Ratchet & Clank.
 */

// Type-specific defaults for description and features
const TYPE_DEFAULTS = {
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

export const GadgetBot = {
	/**
	 * Creates a new GadgetBot input with type-specific defaults
	 * For admin use when adding new bot inventory to the database
	 * @param type - The type of GadgetBot to create
	 * @returns A CreateGadgetBotInput with type-specific defaults and empty name
	 */
	new: (type: "cleaning" | "gardening" | "security"): CreateGadgetBotInput => {
		const defaults = TYPE_DEFAULTS[type]

		return {
			name: "",
			type,
			description: defaults.description,
			status: "available",
			batteryLife: 8.0,
			maxLoadCapacity: 10.0,
			features: [...defaults.features],
			imageUrl: undefined,
		}
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
	S.omit("id", "createdAt", "updatedAt"),
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
